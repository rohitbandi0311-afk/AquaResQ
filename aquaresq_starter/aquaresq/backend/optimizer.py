"""
Exhaustive binary aerator-allocation optimizer for a small MVP farm.

Each pond can receive either its modeled aerator package (on) or no mechanical
aeration (off). This is a simplified planning aid, not an automatic controller.
"""
from typing import Any, Dict, List
from oxygen_model import Pond, simulate_pond


def oxygen_deficit_score(trajectory, target_mg_l: float) -> float:
    """Integrate piecewise-linear DO shortfall over every trajectory interval."""
    score = 0.0
    for left, right in zip(trajectory, trajectory[1:]):
        dt = right["time_hours"] - left["time_hours"]
        deficit_left = max(0.0, target_mg_l - left["do_mg_l"])
        deficit_right = max(0.0, target_mg_l - right["do_mg_l"])
        score += (deficit_left + deficit_right) * 0.5 * dt
    return score


def time_at_or_below_threshold(trajectory, target_mg_l: float) -> float:
    """Integrate time at/below target using linear interpolation per interval."""
    duration = 0.0
    for left, right in zip(trajectory, trajectory[1:]):
        dt = right["time_hours"] - left["time_hours"]
        left_do = left["do_mg_l"]
        right_do = right["do_mg_l"]
        left_below = left_do <= target_mg_l
        right_below = right_do <= target_mg_l
        if left_below and right_below:
            duration += dt
        elif left_below != right_below:
            change = right_do - left_do
            if change != 0:
                crossing_fraction = (target_mg_l - left_do) / change
                below_fraction = crossing_fraction if left_below else 1 - crossing_fraction
                duration += dt * below_fraction
    return duration


def oxygen_exposure_score(trajectory) -> float:
    """Integrate modeled dissolved oxygen over time (mg/L * hours)."""
    score = 0.0
    for left, right in zip(trajectory, trajectory[1:]):
        dt_h = right["time_hours"] - left["time_hours"]
        score += (left["do_mg_l"] + right["do_mg_l"]) * 0.5 * dt_h
    return score


STRATEGY_OBJECTIVE_DIRECTIONS = {
    "integrated_oxygen_deficit": "minimize",
    "pond_hours_below_threshold": "minimize",
    "worst_pond_minimum_do": "maximize",
    "ponds_crossing_threshold": "minimize",
    "energy_consumed": "minimize",
}


def _strategy_objective_values(strategy: Dict[str, Any]) -> Dict[str, float]:
    return {
        "integrated_oxygen_deficit": strategy["aggregate_oxygen_deficit_score"],
        "pond_hours_below_threshold": strategy["total_time_at_or_below_threshold_hours"],
        "worst_pond_minimum_do": strategy["worst_minimum_do_mg_l"],
        "ponds_crossing_threshold": strategy["ponds_crossing_threshold_count"],
        "energy_consumed": strategy["energy_used_kwh"],
    }


def _dominates(left: Dict[str, float], right: Dict[str, float]) -> bool:
    no_worse = True
    strictly_better = False
    for metric, direction in STRATEGY_OBJECTIVE_DIRECTIONS.items():
        left_value = left[metric]
        right_value = right[metric]
        if direction == "minimize":
            no_worse &= left_value <= right_value + 1e-8
            strictly_better |= left_value < right_value - 1e-8
        else:
            no_worse &= left_value >= right_value - 1e-8
            strictly_better |= left_value > right_value + 1e-8
    return no_worse and strictly_better


def _objectives_equal(left: Dict[str, float], right: Dict[str, float]) -> bool:
    return all(
        abs(left[metric] - right[metric]) <= 1e-8
        for metric in STRATEGY_OBJECTIVE_DIRECTIONS
    )


def _compare_strategies(strategies: List[Dict[str, Any]]) -> Dict[str, Any]:
    objective_values = {
        strategy["strategy"]: _strategy_objective_values(strategy)
        for strategy in strategies
    }
    dominated_by = {strategy["strategy"]: [] for strategy in strategies}
    for candidate in strategies:
        candidate_id = candidate["strategy"]
        for other in strategies:
            other_id = other["strategy"]
            if candidate_id != other_id and _dominates(
                objective_values[other_id], objective_values[candidate_id]
            ):
                dominated_by[candidate_id].append(other_id)

    pareto_front = [
        strategy_id for strategy_id, dominators in dominated_by.items()
        if not dominators
    ]
    pairwise = []
    for index, first in enumerate(strategies):
        for second in strategies[index + 1:]:
            first_id = first["strategy"]
            second_id = second["strategy"]
            first_dominates = _dominates(
                objective_values[first_id], objective_values[second_id]
            )
            second_dominates = _dominates(
                objective_values[second_id], objective_values[first_id]
            )
            if first_dominates:
                relation = "first_dominates"
            elif second_dominates:
                relation = "second_dominates"
            elif _objectives_equal(
                objective_values[first_id], objective_values[second_id]
            ):
                relation = "equal"
            else:
                relation = "trade_off"
            pairwise.append({
                "first_strategy": first_id,
                "second_strategy": second_id,
                "relation": relation,
                "first_objectives": objective_values[first_id],
                "second_objectives": objective_values[second_id],
            })

    for strategy in strategies:
        strategy_id = strategy["strategy"]
        strategy["pareto_efficient"] = strategy_id in pareto_front
        strategy["dominated_by_strategies"] = dominated_by[strategy_id]
        strategy["objective_values"] = objective_values[strategy_id]

    return {
        "directions": STRATEGY_OBJECTIVE_DIRECTIONS,
        "pareto_front_strategies": pareto_front,
        "pairwise_comparisons": pairwise,
        "scope": "The Pareto frontier is among the three displayed strategies only.",
    }


def _evaluate_allocation(
    ponds: List[Pond],
    selected_pond_ids: set,
    outage_hours: float,
    target_do_mg_l: float,
    time_step_minutes: int,
    strategy: str,
    reasons: Dict[str, str],
    reason_codes: Dict[str, str],
) -> Dict[str, Any]:
    pond_results = []
    total_deficit = 0.0
    total_time_below_threshold = 0.0
    total_exposure = 0.0
    worst_minimum = float("inf")
    ponds_crossing_threshold = 0
    for pond in ponds:
        powered = pond.pond_id in selected_pond_ids
        result = simulate_pond(
            pond,
            outage_hours=outage_hours,
            time_step_minutes=time_step_minutes,
            alert_threshold_mg_l=target_do_mg_l,
            aeration_available=powered,
        )
        deficit = oxygen_deficit_score(result["trajectory"], target_do_mg_l)
        time_below = time_at_or_below_threshold(
            result["trajectory"], target_do_mg_l
        )
        total_deficit += deficit
        total_time_below_threshold += time_below
        total_exposure += oxygen_exposure_score(result["trajectory"])
        worst_minimum = min(worst_minimum, result["minimum_do_mg_l"])
        ponds_crossing_threshold += time_below > 0
        pond_results.append({
            "pond_id": pond.pond_id,
            "initial_do_mg_l": pond.initial_do_mg_l,
            "alert_threshold_mg_l": target_do_mg_l,
            "aerator_allocated": powered,
            "aerator_load_kw": pond.aerator_load_kw if powered else 0.0,
            "minimum_do_mg_l": result["minimum_do_mg_l"],
            "final_do_mg_l": result["final_do_mg_l"],
            "time_to_target_hours": result["time_to_alert_hours"],
            "oxygen_deficit_score": round(deficit, 8),
            "time_at_or_below_threshold_hours": round(time_below, 8),
            "trajectory": result["trajectory"],
            "allocation_reason": reasons[pond.pond_id],
            "allocation_reason_code": reason_codes[pond.pond_id],
        })

    allocated_power = sum(
        pond.aerator_load_kw for pond in ponds
        if pond.pond_id in selected_pond_ids
    )
    return {
        "strategy": strategy,
        "_objective_values": {
            "total_deficit": total_deficit,
            "total_time_below_threshold": total_time_below_threshold,
            "worst_minimum": worst_minimum,
            "total_oxygen_exposure": total_exposure,
            "ponds_crossing_threshold": ponds_crossing_threshold,
        },
        "generator_power_kw": round(allocated_power, 3),
        "energy_used_kwh": round(allocated_power * outage_hours, 3),
        "aggregate_oxygen_deficit_score": round(
            sum(pond["oxygen_deficit_score"] for pond in pond_results), 8
        ),
        "total_time_at_or_below_threshold_hours": round(
            sum(
                pond["time_at_or_below_threshold_hours"]
                for pond in pond_results
            ),
            8,
        ),
        "worst_minimum_do_mg_l": round(worst_minimum, 5),
        "ponds_crossing_threshold_count": ponds_crossing_threshold,
        "total_oxygen_exposure_score": round(total_exposure, 5),
        "ponds": pond_results,
    }


def optimize_allocation(
    ponds: List[Pond],
    generator_capacity_kw: float,
    outage_hours: float,
    target_do_mg_l: float = 4.0,
    time_step_minutes: int = 5,
    available_energy_kwh: float = None,
) -> Dict[str, Any]:
    if not ponds:
        raise ValueError("At least one pond is required")
    if generator_capacity_kw < 0 or outage_hours <= 0 or target_do_mg_l <= 0:
        raise ValueError("Generator capacity and target must be non-negative; outage must be positive")
    if available_energy_kwh is not None and available_energy_kwh < 0:
        raise ValueError("available_energy_kwh cannot be negative")
    for pond in ponds:
        pond.validate()
        if pond.aerator_load_kw <= 0 and pond.aeration_addition_mg_l_h > 0:
            raise ValueError(f"{pond.pond_id}: set aerator_load_kw for a pond with aeration output")

    best = None
    feasible_count = 0
    capacity_rejections = 0
    energy_rejections = 0
    primary_objective_counts = {}
    full_objective_counts = {}
    n = len(ponds)

    # Enumerate every subset of ponds receiving their full aerator package.
    for mask in range(1 << n):
        selected = [ponds[i] for i in range(n) if mask & (1 << i)]
        total_kw = sum(p.aerator_load_kw for p in selected)
        energy_kwh = total_kw * outage_hours
        if total_kw > generator_capacity_kw + 1e-9:
            capacity_rejections += 1
            continue
        if available_energy_kwh is not None and energy_kwh > available_energy_kwh + 1e-9:
            energy_rejections += 1
            continue
        feasible_count += 1

        selected_ids = {pond.pond_id for pond in selected}
        candidate = _evaluate_allocation(
            ponds,
            selected_ids,
            outage_hours,
            target_do_mg_l,
            time_step_minutes,
            "aquaresq_optimized",
            {
                pond.pond_id: (
                    "Selected as part of the feasible allocation minimizing total "
                    "time-integrated oxygen deficit, with worst-pond oxygen and "
                    "total modeled oxygen exposure as tie-breakers."
                    if pond.pond_id in selected_ids else
                    "Not selected by the minimum-deficit objective under the "
                    "generator capacity and fuel-energy constraints."
                )
                for pond in ponds
            },
            {
                pond.pond_id: (
                    "optimized_selected" if pond.pond_id in selected_ids
                    else "optimized_not_selected"
                )
                for pond in ponds
            },
        )

        # Minimize aggregate deficit; then protect the worst pond and maximize
        # modeled oxygen exposure before preferring a lower generator load.
        key = (
            round(candidate["_objective_values"]["total_deficit"], 8),
            -round(candidate["_objective_values"]["worst_minimum"], 8),
            -round(candidate["_objective_values"]["total_oxygen_exposure"], 8),
            total_kw,
        )
        primary_score = key[0]
        primary_objective_counts[primary_score] = (
            primary_objective_counts.get(primary_score, 0) + 1
        )
        full_objective_counts[key] = full_objective_counts.get(key, 0) + 1
        if best is None or key < best["key"]:
            best = {
                "key": key,
                "total_kw": total_kw,
                "energy_kwh": energy_kwh,
                "candidate": candidate,
                "selected_ids": selected_ids,
            }

    if best is None:
        raise ValueError("No feasible allocation found for the supplied constraints")

    powered_count = len(best["selected_ids"])
    configured_packages = [pond for pond in ponds if pond.aerator_load_kw > 0]
    if powered_count:
        allocation_status = "allocated"
        allocation_explanation = (
            f"Selected {powered_count} of {len(configured_packages)} configured aerator "
            "packages using the stated modeled objective, within generator capacity "
            "and available fuel energy. See the strategy comparison for whether the "
            "integrated oxygen deficit decreased."
        )
        if powered_count < len(configured_packages):
            allocation_explanation += (
                " Remaining packages could not improve modeled oxygen or would exceed "
                "the generator capacity or fuel-energy limit."
            )
    elif not configured_packages:
        allocation_status = "no_packages"
        allocation_explanation = (
            "No aerator package was selected because no pond has a positive aerator "
            "power load configured."
        )
    else:
        minimum_package_kw = min(pond.aerator_load_kw for pond in configured_packages)
        minimum_package_energy = minimum_package_kw * outage_hours
        if generator_capacity_kw + 1e-9 < minimum_package_kw:
            allocation_status = "capacity_limit"
            allocation_explanation = (
                f"No aerator package fits: the smallest configured package requires "
                f"{minimum_package_kw:g} kW, above the generator capacity of "
                f"{generator_capacity_kw:g} kW."
            )
        elif (
            available_energy_kwh is not None
            and available_energy_kwh + 1e-9 < minimum_package_energy
        ):
            allocation_status = "energy_limit"
            allocation_explanation = (
                f"No aerator package fits the fuel limit: the smallest package needs "
                f"{minimum_package_energy:g} kWh for this outage, but only "
                f"{available_energy_kwh:g} kWh is available."
            )
        else:
            allocation_status = "no_modeled_benefit"
            allocation_explanation = (
                "No aerator package was selected because the configured aerators "
                "provide no modeled oxygen improvement."
            )

    no_allocation = _evaluate_allocation(
        ponds,
        set(),
        outage_hours,
        target_do_mg_l,
        time_step_minutes,
        "no_generator",
        {
            pond.pond_id: "Reference scenario: no generator power is assigned."
            for pond in ponds
        },
        {pond.pond_id: "no_generator_reference" for pond in ponds},
    )
    primary_tie_count = primary_objective_counts[best["key"][0]]
    full_tie_count = full_objective_counts[best["key"]]
    no_generator_deficit = no_allocation["_objective_values"]["total_deficit"]
    optimized_deficit = best["candidate"]["_objective_values"]["total_deficit"]
    if optimized_deficit < no_generator_deficit - 1e-8:
        objective_outcome = "deficit_reduced"
        objective_explanation = (
            "The optimized allocation has a lower modeled integrated oxygen deficit "
            "than the no-generator reference for these supplied inputs."
        )
    elif optimized_deficit > no_generator_deficit + 1e-8:
        objective_outcome = "deficit_not_reduced"
        objective_explanation = (
            "The optimized allocation did not reduce modeled integrated oxygen "
            "deficit compared with the no-generator reference."
        )
    else:
        objective_outcome = "no_deficit_reduction"
        objective_explanation = (
            "The optimized allocation has the same modeled integrated oxygen deficit "
            "as the no-generator reference; no reduction in that objective is claimed."
        )
    if primary_tie_count > 1:
        objective_explanation += (
            f" {primary_tie_count} feasible allocations share the same primary "
            "integrated-deficit score; ties are resolved by worst-pond minimum DO, "
            "total modeled DO exposure, then lower generator load."
        )
    if full_tie_count > 1:
        objective_explanation += (
            f" {full_tie_count} allocations also tie on all objective values; the "
            "first allocation in deterministic pond-input enumeration is returned."
        )

    baseline_ids = set()
    baseline_power = 0.0
    baseline_reasons = {}
    baseline_reason_codes = {}
    for pond in sorted(ponds, key=lambda item: (item.initial_do_mg_l, item.pond_id)):
        if pond.aerator_load_kw <= 0:
            baseline_reason_codes[pond.pond_id] = "not_configured"
            baseline_reasons[pond.pond_id] = (
                "Not eligible: no positive aerator power load is configured."
            )
            continue
        next_power = baseline_power + pond.aerator_load_kw
        next_energy = next_power * outage_hours
        if next_power > generator_capacity_kw + 1e-9:
            baseline_reason_codes[pond.pond_id] = "capacity_exceeded"
            baseline_reasons[pond.pond_id] = (
                f"Not selected: {pond.initial_do_mg_l:g} mg/L starting DO ranked "
                "by highest initial risk, but its package would exceed generator capacity."
            )
        elif (
            available_energy_kwh is not None
            and next_energy > available_energy_kwh + 1e-9
        ):
            baseline_reason_codes[pond.pond_id] = "energy_exceeded"
            baseline_reasons[pond.pond_id] = (
                f"Not selected: {pond.initial_do_mg_l:g} mg/L starting DO ranked "
                "by highest initial risk, but its package would exceed available fuel energy."
            )
        else:
            baseline_ids.add(pond.pond_id)
            baseline_reason_codes[pond.pond_id] = "baseline_selected"
            baseline_power = next_power
            baseline_reasons[pond.pond_id] = (
                f"Selected by baseline order: starting DO {pond.initial_do_mg_l:g} mg/L "
                "is highest initial risk among remaining ponds, and the package fits "
                "capacity and fuel constraints."
            )

    baseline = _evaluate_allocation(
        ponds,
        baseline_ids,
        outage_hours,
        target_do_mg_l,
        time_step_minutes,
        "highest_initial_risk",
        baseline_reasons,
        baseline_reason_codes,
    )
    optimized = best["candidate"]
    optimized["strategy"] = "aquaresq_optimized"
    optimized_reasons = {}
    optimized_reason_codes = {}
    for pond in ponds:
        if pond.pond_id in best["selected_ids"]:
            optimized_reasons[pond.pond_id] = (
                "Selected in the allocation minimizing total time-integrated oxygen "
                "deficit; worst-pond oxygen and modeled oxygen exposure break ties."
            )
            optimized_reason_codes[pond.pond_id] = "optimized_selected"
        else:
            optimized_reasons[pond.pond_id] = (
                "Not selected because the globally best feasible allocation under the "
                "shared deficit objective did not include this pond."
            )
            optimized_reason_codes[pond.pond_id] = "optimized_not_selected"
    optimized = _evaluate_allocation(
        ponds,
        best["selected_ids"],
        outage_hours,
        target_do_mg_l,
        time_step_minutes,
        "aquaresq_optimized",
        optimized_reasons,
        optimized_reason_codes,
    )
    comparison_strategies = [no_allocation, baseline, optimized]
    for strategy in comparison_strategies:
        strategy.pop("_objective_values")
        strategy["generator_capacity_kw"] = generator_capacity_kw
        strategy["available_energy_kwh"] = available_energy_kwh
        strategy["capacity_respected"] = (
            strategy["generator_power_kw"] <= generator_capacity_kw + 1e-9
        )
        strategy["fuel_energy_respected"] = (
            None if available_energy_kwh is None else
            strategy["energy_used_kwh"] <= available_energy_kwh + 1e-9
        )
    strategy_analysis = _compare_strategies(comparison_strategies)

    return {
        "generator_capacity_kw": generator_capacity_kw,
        "outage_hours": outage_hours,
        "available_energy_kwh": available_energy_kwh,
        "allocated_power_kw": round(best["total_kw"], 3),
        "estimated_energy_kwh": round(best["energy_kwh"], 3),
        "aggregate_oxygen_deficit_score": optimized["aggregate_oxygen_deficit_score"],
        "total_time_at_or_below_threshold_hours": optimized[
            "total_time_at_or_below_threshold_hours"
        ],
        "protection_threshold_mg_l": target_do_mg_l,
        "objective_outcome": objective_outcome,
        "objective_explanation": objective_explanation,
        "recommendation_policy": {
            "type": "lexicographic",
            "ordered_objectives": [
                "minimize integrated oxygen deficit",
                "maximize worst-pond minimum DO",
                "maximize total modeled oxygen exposure",
                "minimize generator power",
            ],
            "uses_weighted_sum": False,
            "explanation": (
                "AquaResQ selects the feasible allocation with the lowest integrated "
                "oxygen deficit. If tied, it prefers higher worst-pond minimum DO, "
                "then higher total modeled DO exposure, then lower generator power. "
                "Pond-hours below threshold and number of ponds crossing threshold "
                "are reported for comparison, but are not currently optimizer "
                "selection criteria."
            ),
        },
        "strategy_analysis": strategy_analysis,
        "metric_methodology": (
            "Each strategy uses the same oxygen model, outage duration, protection "
            "threshold, pond inputs, and time-step setting. Integrated deficit and "
            "time below threshold are computed from every adjacent trajectory pair "
            "using linear interpolation where a threshold crossing occurs. Pond "
            "metrics are summed without area, biomass, or other weighting. "
            "Threshold-crossing count counts each pond once if it starts at or "
            "reaches the threshold during the scenario."
        ),
        "equal_primary_objective_allocations": primary_tie_count,
        "equal_full_objective_allocations": full_tie_count,
        "feasible_allocations_evaluated": feasible_count,
        "constraint_summary": {
            "total_allocations_considered": 1 << n,
            "feasible_allocations_evaluated": feasible_count,
            "generator_capacity_rejections": capacity_rejections,
            "fuel_energy_rejections": energy_rejections,
            "generator_capacity_kw": generator_capacity_kw,
            "available_energy_kwh": available_energy_kwh,
            "explanation": (
                "Each whole-pond aerator subset was checked. Subsets above generator "
                "capacity were excluded first; among the remaining subsets, those "
                "above available fuel energy were excluded. The selected allocation "
                "is the best feasible subset under the stated recommendation rule."
            ),
        },
        "allocation": [
            {
                key: pond[key]
                for key in (
                    "pond_id", "aerator_allocated", "aerator_load_kw",
                    "minimum_do_mg_l", "final_do_mg_l", "time_to_target_hours",
                    "oxygen_deficit_score",
                    "time_at_or_below_threshold_hours",
                )
            }
            for pond in optimized["ponds"]
        ],
        "allocation_status": allocation_status,
        "allocation_explanation": allocation_explanation,
        "comparison_strategies": comparison_strategies,
        "disclaimer": (
            "SIMULATED PLANNING OUTPUT ONLY. Binary whole-pond aerator packages and "
            "the user-supplied oxygen parameters are assumed. They are illustrative "
            "and not field validated. Not an automatic controller or real-farm "
            "operating recommendation."
        ),
        "energy_assumption": (
            "Estimated energy assumes each assigned aerator load runs continuously "
            "for the full outage duration: kW × hours."
        ),
    }
