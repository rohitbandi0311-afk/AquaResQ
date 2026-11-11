import unittest
from oxygen_model import Pond, simulate_pond
from optimizer import (
    optimize_allocation,
    oxygen_deficit_score,
    time_at_or_below_threshold,
)


class OptimizerTests(unittest.TestCase):
    def ponds(self):
        return [
            Pond("P1", 5000, 1.2, 5.0, 1000, aeration_addition_mg_l_h=0.4, aerator_load_kw=6),
            Pond("P2", 5000, 1.2, 5.0, 1000, aeration_addition_mg_l_h=0.3, aerator_load_kw=4),
        ]

    def equal_pond_packages(self):
        return [
            Pond(
                f"P{i}", 5000, 1.2, 5.0, 1000,
                aeration_addition_mg_l_h=0.4,
                aerator_load_kw=2,
            )
            for i in range(1, 4)
        ]

    def synthetic_12_hour_stress_ponds(self):
        # SIMULATED illustrative inputs only; these are not farm measurements.
        starting_do_and_demand = [
            (3.9, 0.45),
            (3.3, 0.15),
            (4.6, 0.80),
        ]
        return [
            Pond(
                f"P{i}",
                2000,
                0.8,
                starting_do,
                2500,
                water_column_demand_mg_l_h=water_demand,
                sediment_demand_mg_l_h=0.25,
                shrimp_respiration_mg_kg_h=2.0,
                aeration_addition_mg_l_h=0.8,
                aerator_load_kw=2.0,
            )
            for i, (starting_do, water_demand) in enumerate(
                starting_do_and_demand, start=1
            )
        ]

    def test_capacity_constraint_respected(self):
        result = optimize_allocation(self.ponds(), 6, 4)
        self.assertLessEqual(result["allocated_power_kw"], 6)
        self.assertGreater(result["feasible_allocations_evaluated"], 0)

    def test_energy_constraint_respected(self):
        result = optimize_allocation(self.ponds(), 10, 4, available_energy_kwh=16)
        self.assertLessEqual(result["estimated_energy_kwh"], 16)

    def test_zero_capacity_allocates_no_aerators(self):
        result = optimize_allocation(self.ponds(), 0, 4)
        self.assertEqual(result["allocated_power_kw"], 0)
        self.assertFalse(any(x["aerator_allocated"] for x in result["allocation"]))
        self.assertIn("generator capacity", result["allocation_explanation"])

    def test_four_kw_capacity_allocates_two_two_kw_packages(self):
        result = optimize_allocation(self.equal_pond_packages(), 4, 6)
        self.assertEqual(result["allocated_power_kw"], 4)
        self.assertEqual(sum(item["aerator_allocated"] for item in result["allocation"]), 2)

    def test_six_kw_capacity_allocates_all_three_packages(self):
        result = optimize_allocation(self.equal_pond_packages(), 6, 6)
        self.assertEqual(result["allocated_power_kw"], 6)
        self.assertEqual(sum(item["aerator_allocated"] for item in result["allocation"]), 3)

    def test_two_kw_capacity_allocates_one_package(self):
        result = optimize_allocation(self.equal_pond_packages(), 2, 6)
        self.assertEqual(result["allocated_power_kw"], 2)
        self.assertEqual(sum(item["aerator_allocated"] for item in result["allocation"]), 1)

    def test_fuel_energy_limit_restricts_allocation(self):
        result = optimize_allocation(
            self.equal_pond_packages(), 6, 6, available_energy_kwh=12
        )
        self.assertEqual(result["allocated_power_kw"], 2)
        self.assertEqual(result["estimated_energy_kwh"], 12)
        self.assertEqual(sum(item["aerator_allocated"] for item in result["allocation"]), 1)

    def test_insufficient_fuel_energy_explains_zero_allocation(self):
        result = optimize_allocation(
            self.equal_pond_packages(), 6, 6, available_energy_kwh=11
        )
        self.assertEqual(result["allocated_power_kw"], 0)
        self.assertIn("fuel limit", result["allocation_explanation"])

    def test_zero_oxygen_output_explains_why_packages_are_not_selected(self):
        ponds = [
            Pond(f"P{i}", 5000, 1.2, 5.0, 1000, aerator_load_kw=2)
            for i in range(1, 4)
        ]
        result = optimize_allocation(ponds, 4, 6)
        self.assertEqual(result["allocated_power_kw"], 0)
        self.assertEqual(result["allocation_status"], "no_modeled_benefit")
        self.assertIn("no modeled oxygen improvement", result["allocation_explanation"])

    def test_comparison_strategies_share_objective_and_trajectory_data(self):
        ponds = self.equal_pond_packages()
        result = optimize_allocation(
            ponds, 4, 6, target_do_mg_l=4.5, available_energy_kwh=12
        )
        strategies = result["comparison_strategies"]
        self.assertEqual(
            [strategy["strategy"] for strategy in strategies],
            ["no_generator", "highest_initial_risk", "aquaresq_optimized"],
        )
        for strategy in strategies:
            self.assertLessEqual(strategy["generator_power_kw"], 4)
            self.assertLessEqual(strategy["energy_used_kwh"], 12)
            self.assertEqual(len(strategy["ponds"]), len(ponds))
            self.assertAlmostEqual(
                strategy["aggregate_oxygen_deficit_score"],
                round(sum(pond["oxygen_deficit_score"] for pond in strategy["ponds"]), 8),
            )
            for pond in strategy["ponds"]:
                self.assertEqual(pond["trajectory"][0]["time_hours"], 0)
                self.assertEqual(
                    pond["trajectory"][-1]["time_hours"], 6
                )
                self.assertTrue(pond["allocation_reason"])
                self.assertEqual(pond["alert_threshold_mg_l"], 4.5)
                self.assertAlmostEqual(
                    pond["minimum_do_mg_l"],
                    min(point["do_mg_l"] for point in pond["trajectory"]),
                )
            self.assertLessEqual(strategy["generator_power_kw"], result["generator_capacity_kw"])
            self.assertLessEqual(strategy["energy_used_kwh"], 12)
            self.assertAlmostEqual(
                strategy["energy_used_kwh"],
                strategy["generator_power_kw"] * result["outage_hours"],
            )

    def test_comparison_no_generator_is_reference_and_optimizer_matches_response(self):
        result = optimize_allocation(self.equal_pond_packages(), 4, 6)
        no_generator, _, optimized = result["comparison_strategies"]
        self.assertEqual(no_generator["generator_power_kw"], 0)
        self.assertEqual(no_generator["energy_used_kwh"], 0)
        self.assertFalse(any(pond["aerator_allocated"] for pond in no_generator["ponds"]))
        self.assertEqual(
            optimized["generator_power_kw"], result["allocated_power_kw"]
        )
        self.assertEqual(
            optimized["aggregate_oxygen_deficit_score"],
            result["aggregate_oxygen_deficit_score"],
        )
        self.assertEqual(
            [pond["aerator_allocated"] for pond in optimized["ponds"]],
            [pond["aerator_allocated"] for pond in result["allocation"]],
        )

    def test_baseline_selects_highest_initial_risk_first(self):
        ponds = self.equal_pond_packages()
        ponds[0].initial_do_mg_l = 3.2
        ponds[1].initial_do_mg_l = 4.1
        ponds[2].initial_do_mg_l = 5.3
        result = optimize_allocation(ponds, 2, 6)
        _, baseline, _ = result["comparison_strategies"]
        powered = [pond["pond_id"] for pond in baseline["ponds"] if pond["aerator_allocated"]]
        self.assertEqual(powered, ["P1"])
        self.assertIn("highest initial risk", baseline["ponds"][0]["allocation_reason"])

    def test_aeration_changes_trajectory_when_configured_output_is_positive(self):
        pond = self.equal_pond_packages()[0]
        without_aeration = simulate_pond(pond, 6, aeration_available=False)
        with_aeration = simulate_pond(pond, 6, aeration_available=True)
        self.assertNotEqual(
            without_aeration["trajectory"], with_aeration["trajectory"]
        )
        self.assertGreater(
            with_aeration["trajectory"][-1]["do_mg_l"],
            without_aeration["trajectory"][-1]["do_mg_l"],
        )
        self.assertEqual(with_aeration["minimum_do_mg_l"], pond.initial_do_mg_l)
        self.assertEqual(without_aeration["minimum_do_mg_l"], pond.initial_do_mg_l)

    def test_deficit_and_time_below_threshold_integrate_every_interval(self):
        trajectory = [
            {"time_hours": 0.0, "do_mg_l": 5.0},
            {"time_hours": 2.0, "do_mg_l": 3.0},
            {"time_hours": 4.0, "do_mg_l": 5.0},
        ]
        self.assertEqual(oxygen_deficit_score(trajectory, 4.0), 2.0)
        self.assertEqual(time_at_or_below_threshold(trajectory, 4.0), 2.0)

    def test_simulation_includes_fractional_final_time_step(self):
        pond = self.equal_pond_packages()[0]
        result = simulate_pond(pond, outage_hours=1.03, time_step_minutes=5)
        self.assertEqual(result["trajectory"][-1]["time_hours"], 1.03)

    def test_equal_objectives_do_not_claim_deficit_improvement(self):
        ponds = [
            Pond(f"P{i}", 5000, 1.2, 5.0, 1000, aerator_load_kw=2)
            for i in range(1, 4)
        ]
        result = optimize_allocation(ponds, 4, 6)
        deficits = [
            strategy["aggregate_oxygen_deficit_score"]
            for strategy in result["comparison_strategies"]
        ]
        self.assertEqual(deficits, [0.0, 0.0, 0.0])
        self.assertEqual(result["objective_outcome"], "no_deficit_reduction")
        self.assertIn("no reduction", result["objective_explanation"])
        self.assertEqual(result["equal_primary_objective_allocations"], 7)

    def test_equal_strategy_performance_is_reported_as_equal_and_pareto_efficient(self):
        result = optimize_allocation(self.equal_pond_packages(), 0, 6)
        analysis = result["strategy_analysis"]
        self.assertEqual(
            analysis["pareto_front_strategies"],
            ["no_generator", "highest_initial_risk", "aquaresq_optimized"],
        )
        self.assertTrue(all(
            strategy["pareto_efficient"]
            for strategy in result["comparison_strategies"]
        ))
        self.assertTrue(all(
            pair["relation"] == "equal"
            for pair in analysis["pairwise_comparisons"]
        ))
        self.assertEqual(result["objective_outcome"], "no_deficit_reduction")

    def test_optimizer_results_are_deterministic_for_identical_inputs(self):
        first = optimize_allocation(self.equal_pond_packages(), 4, 6, 4.5)
        second = optimize_allocation(self.equal_pond_packages(), 4, 6, 4.5)
        self.assertEqual(first, second)

    def test_simulated_challenging_case_distinguishes_strategies(self):
        ponds = self.synthetic_12_hour_stress_ponds()
        result = optimize_allocation(
            ponds, 4, 12, target_do_mg_l=4.0, available_energy_kwh=48
        )
        no_generator, baseline, optimized = result["comparison_strategies"]
        self.assertEqual(result["objective_outcome"], "deficit_reduced")
        self.assertEqual(
            [strategy["strategy"] for strategy in result["comparison_strategies"]],
            ["no_generator", "highest_initial_risk", "aquaresq_optimized"],
        )
        self.assertEqual(
            [pond.initial_do_mg_l for pond in ponds], [3.9, 3.3, 4.6]
        )
        self.assertGreater(no_generator["aggregate_oxygen_deficit_score"], 0)
        self.assertLess(
            optimized["aggregate_oxygen_deficit_score"],
            no_generator["aggregate_oxygen_deficit_score"],
        )
        self.assertLessEqual(
            optimized["aggregate_oxygen_deficit_score"],
            baseline["aggregate_oxygen_deficit_score"],
        )
        self.assertNotEqual(
            [p["aerator_allocated"] for p in baseline["ponds"]],
            [p["aerator_allocated"] for p in optimized["ponds"]],
        )
        self.assertEqual(baseline["generator_power_kw"], 4)
        self.assertEqual(optimized["generator_power_kw"], 4)
        self.assertEqual(baseline["energy_used_kwh"], 48)
        self.assertEqual(optimized["energy_used_kwh"], 48)
        self.assertLess(
            optimized["aggregate_oxygen_deficit_score"],
            baseline["aggregate_oxygen_deficit_score"],
        )
        self.assertEqual(
            result["objective_explanation"],
            "The optimized allocation has a lower modeled integrated oxygen deficit "
            "than the no-generator reference for these supplied inputs.",
        )
        self.assertNotEqual(
            simulate_pond(ponds[0], outage_hours=12, alert_threshold_mg_l=4.0)["trajectory"],
            simulate_pond(
                ponds[0], outage_hours=12, alert_threshold_mg_l=4.0,
                aeration_available=True,
            )["trajectory"],
        )
        feasible_deficits = []
        for mask in range(1 << len(ponds)):
            selected = [
                pond for index, pond in enumerate(ponds)
                if mask & (1 << index)
            ]
            load = sum(pond.aerator_load_kw for pond in selected)
            energy = load * 12
            if load > 4 or energy > 48:
                continue
            selected_ids = {pond.pond_id for pond in selected}
            feasible_deficits.append(sum(
                oxygen_deficit_score(
                    simulate_pond(
                        pond, outage_hours=12, alert_threshold_mg_l=4.0,
                        aeration_available=pond.pond_id in selected_ids,
                    )["trajectory"],
                    4.0,
                )
                for pond in ponds
            ))
        self.assertEqual(
            optimized["aggregate_oxygen_deficit_score"],
            round(min(feasible_deficits), 8),
        )
        self.assertEqual(
            result["strategy_analysis"]["pareto_front_strategies"],
            ["no_generator", "highest_initial_risk", "aquaresq_optimized"],
        )
        baseline_optimized = next(
            pair for pair in result["strategy_analysis"]["pairwise_comparisons"]
            if pair["first_strategy"] == "highest_initial_risk"
            and pair["second_strategy"] == "aquaresq_optimized"
        )
        self.assertEqual(baseline_optimized["relation"], "trade_off")
        self.assertLess(
            baseline["total_time_at_or_below_threshold_hours"],
            optimized["total_time_at_or_below_threshold_hours"],
        )
        self.assertLess(
            optimized["aggregate_oxygen_deficit_score"],
            baseline["aggregate_oxygen_deficit_score"],
        )
        for strategy in result["comparison_strategies"]:
            self.assertLessEqual(strategy["generator_power_kw"], 4)
            self.assertLessEqual(strategy["energy_used_kwh"], 48)
            self.assertTrue(strategy["capacity_respected"])
            self.assertTrue(strategy["fuel_energy_respected"])
            self.assertEqual(strategy["available_energy_kwh"], 48)
            self.assertEqual(
                strategy["energy_used_kwh"],
                round(strategy["generator_power_kw"] * 12, 3),
            )
            self.assertEqual(
                strategy["aggregate_oxygen_deficit_score"],
                round(sum(p["oxygen_deficit_score"] for p in strategy["ponds"]), 8),
            )
            self.assertEqual(
                strategy["total_time_at_or_below_threshold_hours"],
                round(sum(
                    p["time_at_or_below_threshold_hours"] for p in strategy["ponds"]
                ), 8),
            )
            for pond in strategy["ponds"]:
                self.assertEqual(pond["trajectory"][-1]["time_hours"], 12.0)
                self.assertEqual(pond["alert_threshold_mg_l"], 4.0)
                self.assertEqual(
                    pond["time_to_target_hours"] is not None,
                    pond["minimum_do_mg_l"] <= 4.0,
                )
                self.assertAlmostEqual(
                    pond["final_do_mg_l"],
                    pond["trajectory"][-1]["do_mg_l"],
                )
                self.assertAlmostEqual(
                    pond["minimum_do_mg_l"],
                    min(point["do_mg_l"] for point in pond["trajectory"]),
                )
                self.assertEqual(
                    pond["oxygen_deficit_score"],
                    round(oxygen_deficit_score(pond["trajectory"], 4.0), 8),
                )
                self.assertEqual(
                    pond["time_at_or_below_threshold_hours"],
                    round(time_at_or_below_threshold(pond["trajectory"], 4.0), 8),
                )

    def test_empty_ponds_rejected(self):
        with self.assertRaises(ValueError):
            optimize_allocation([], 10, 4)

    def test_selected_allocation_matches_brute_force_lexicographic_search(self):
        ponds = self.synthetic_12_hour_stress_ponds()
        outage_hours = 12
        target_do_mg_l = 4.0
        constraints = ((4, 48), (4, 24), (2, 48))

        for capacity_kw, available_energy_kwh in constraints:
            with self.subTest(
                capacity_kw=capacity_kw,
                available_energy_kwh=available_energy_kwh,
            ):
                result = optimize_allocation(
                    ponds,
                    capacity_kw,
                    outage_hours,
                    target_do_mg_l=target_do_mg_l,
                    time_step_minutes=15,
                    available_energy_kwh=available_energy_kwh,
                )
                feasible_objectives = []
                selected_ids = {
                    item["pond_id"] for item in result["allocation"]
                    if item["aerator_allocated"]
                }

                for mask in range(1 << len(ponds)):
                    load_kw = sum(
                        pond.aerator_load_kw
                        for index, pond in enumerate(ponds)
                        if mask & (1 << index)
                    )
                    energy_kwh = load_kw * outage_hours
                    if (
                        load_kw > capacity_kw + 1e-9
                        or energy_kwh > available_energy_kwh + 1e-9
                    ):
                        continue

                    deficit = 0.0
                    exposure = 0.0
                    worst_minimum = float("inf")
                    for index, pond in enumerate(ponds):
                        powered = bool(mask & (1 << index))
                        trajectory = simulate_pond(
                            pond,
                            outage_hours=outage_hours,
                            time_step_minutes=15,
                            alert_threshold_mg_l=target_do_mg_l,
                            aeration_available=powered,
                        )["trajectory"]
                        minimum = min(point["do_mg_l"] for point in trajectory)
                        worst_minimum = min(worst_minimum, minimum)
                        for left, right in zip(trajectory, trajectory[1:]):
                            dt = right["time_hours"] - left["time_hours"]
                            left_deficit = max(0, target_do_mg_l - left["do_mg_l"])
                            right_deficit = max(0, target_do_mg_l - right["do_mg_l"])
                            deficit += (left_deficit + right_deficit) * 0.5 * dt
                            exposure += (
                                left["do_mg_l"] + right["do_mg_l"]
                            ) * 0.5 * dt

                    feasible_objectives.append((
                        (
                            round(deficit, 8),
                            -round(worst_minimum, 8),
                            -round(exposure, 8),
                            load_kw,
                        ),
                        {
                            pond.pond_id
                            for index, pond in enumerate(ponds)
                            if mask & (1 << index)
                        },
                    ))

                selected_objective = next(
                    objective for objective, allocation in feasible_objectives
                    if allocation == selected_ids
                )
                self.assertEqual(
                    selected_objective,
                    min(objective for objective, _ in feasible_objectives),
                )
                self.assertLessEqual(result["allocated_power_kw"], capacity_kw)
                self.assertLessEqual(
                    result["estimated_energy_kwh"], available_energy_kwh
                )


if __name__ == "__main__":
    unittest.main()
