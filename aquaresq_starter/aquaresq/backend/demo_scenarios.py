"""Reproducible, illustrative inputs for the judge demonstration."""
from copy import deepcopy
from typing import Any, Dict

from optimizer import optimize_allocation
from oxygen_model import Pond
from risk_engine import analyze_farm


_SCENARIOS = {
    "normal": {
        "name": "Normal operating conditions",
        "classification": "SIMULATED",
        "inputs": {
            "outage_hours": 2.0,
            "time_step_minutes": 5,
            "protection_threshold_mg_l": 4.0,
            "critical_threshold_mg_l": 3.0,
            "generator_capacity_kw": 4.0,
            "available_energy_kwh": 8.0,
            "ponds": [
                {"pond_id": "P1", "area_m2": 5000, "average_depth_m": 1.2, "initial_do_mg_l": 6.2, "biomass_kg": 1000, "water_column_demand_mg_l_h": 0.05, "sediment_demand_mg_l_h": 0.03, "shrimp_respiration_mg_kg_h": 0.20, "photosynthesis_mg_l_h": 0.0, "reaeration_per_h": 0.05, "saturation_do_mg_l": 7.0, "aeration_addition_mg_l_h": 0.4, "aerator_load_kw": 2.0},
                {"pond_id": "P2", "area_m2": 6500, "average_depth_m": 1.3, "initial_do_mg_l": 5.9, "biomass_kg": 1200, "water_column_demand_mg_l_h": 0.06, "sediment_demand_mg_l_h": 0.04, "shrimp_respiration_mg_kg_h": 0.20, "photosynthesis_mg_l_h": 0.0, "reaeration_per_h": 0.05, "saturation_do_mg_l": 7.0, "aeration_addition_mg_l_h": 0.4, "aerator_load_kw": 2.0},
                {"pond_id": "P3", "area_m2": 4200, "average_depth_m": 1.1, "initial_do_mg_l": 6.4, "biomass_kg": 900, "water_column_demand_mg_l_h": 0.05, "sediment_demand_mg_l_h": 0.03, "shrimp_respiration_mg_kg_h": 0.20, "photosynthesis_mg_l_h": 0.0, "reaeration_per_h": 0.05, "saturation_do_mg_l": 7.0, "aeration_addition_mg_l_h": 0.4, "aerator_load_kw": 2.0},
            ],
        },
    },
    "moderate": {
        "name": "Moderate power outage",
        "classification": "SIMULATED",
        "inputs": {
            "outage_hours": 6.0,
            "time_step_minutes": 5,
            "protection_threshold_mg_l": 4.0,
            "critical_threshold_mg_l": 3.0,
            "generator_capacity_kw": 4.0,
            "available_energy_kwh": 18.0,
            "ponds": [
                {"pond_id": "P1", "area_m2": 5000, "average_depth_m": 1.2, "initial_do_mg_l": 4.8, "biomass_kg": 1800, "water_column_demand_mg_l_h": 0.12, "sediment_demand_mg_l_h": 0.12, "shrimp_respiration_mg_kg_h": 0.8, "photosynthesis_mg_l_h": 0.0, "reaeration_per_h": 0.05, "saturation_do_mg_l": 7.0, "aeration_addition_mg_l_h": 0.55, "aerator_load_kw": 2.0},
                {"pond_id": "P2", "area_m2": 6500, "average_depth_m": 1.3, "initial_do_mg_l": 4.4, "biomass_kg": 2100, "water_column_demand_mg_l_h": 0.15, "sediment_demand_mg_l_h": 0.14, "shrimp_respiration_mg_kg_h": 0.8, "photosynthesis_mg_l_h": 0.0, "reaeration_per_h": 0.05, "saturation_do_mg_l": 7.0, "aeration_addition_mg_l_h": 0.55, "aerator_load_kw": 2.0},
                {"pond_id": "P3", "area_m2": 4200, "average_depth_m": 1.1, "initial_do_mg_l": 5.1, "biomass_kg": 1500, "water_column_demand_mg_l_h": 0.10, "sediment_demand_mg_l_h": 0.11, "shrimp_respiration_mg_kg_h": 0.8, "photosynthesis_mg_l_h": 0.0, "reaeration_per_h": 0.05, "saturation_do_mg_l": 7.0, "aeration_addition_mg_l_h": 0.55, "aerator_load_kw": 2.0},
            ],
        },
    },
    "critical": {
        "name": "Critical multi-pond emergency",
        "classification": "SIMULATED",
        "inputs": {
            "outage_hours": 12.0,
            "time_step_minutes": 5,
            "protection_threshold_mg_l": 4.0,
            "critical_threshold_mg_l": 3.0,
            "generator_capacity_kw": 4.0,
            "available_energy_kwh": 48.0,
            "ponds": [
                {"pond_id": "P1", "area_m2": 2000, "average_depth_m": 0.8, "initial_do_mg_l": 3.9, "biomass_kg": 2500, "water_column_demand_mg_l_h": 0.45, "sediment_demand_mg_l_h": 0.25, "shrimp_respiration_mg_kg_h": 2.0, "photosynthesis_mg_l_h": 0.0, "reaeration_per_h": 0.05, "saturation_do_mg_l": 7.0, "aeration_addition_mg_l_h": 0.8, "aerator_load_kw": 2.0},
                {"pond_id": "P2", "area_m2": 2000, "average_depth_m": 0.8, "initial_do_mg_l": 3.3, "biomass_kg": 2500, "water_column_demand_mg_l_h": 0.15, "sediment_demand_mg_l_h": 0.25, "shrimp_respiration_mg_kg_h": 2.0, "photosynthesis_mg_l_h": 0.0, "reaeration_per_h": 0.05, "saturation_do_mg_l": 7.0, "aeration_addition_mg_l_h": 0.8, "aerator_load_kw": 2.0},
                {"pond_id": "P3", "area_m2": 2000, "average_depth_m": 0.8, "initial_do_mg_l": 4.6, "biomass_kg": 2500, "water_column_demand_mg_l_h": 0.80, "sediment_demand_mg_l_h": 0.25, "shrimp_respiration_mg_kg_h": 2.0, "photosynthesis_mg_l_h": 0.0, "reaeration_per_h": 0.05, "saturation_do_mg_l": 7.0, "aeration_addition_mg_l_h": 0.8, "aerator_load_kw": 2.0},
            ],
        },
    },
}


def list_demo_scenarios() -> list:
    return [
        {"id": scenario_id, "name": scenario["name"], "classification": scenario["classification"]}
        for scenario_id, scenario in _SCENARIOS.items()
    ]


def run_demo_scenario(scenario_id: str) -> Dict[str, Any]:
    if scenario_id not in _SCENARIOS:
        raise KeyError(scenario_id)

    scenario = deepcopy(_SCENARIOS[scenario_id])
    inputs = scenario["inputs"]
    ponds = [Pond(**pond_data) for pond_data in inputs["ponds"]]
    simulation = analyze_farm(
        ponds,
        outage_hours=inputs["outage_hours"],
        time_step_minutes=inputs["time_step_minutes"],
        alert_threshold_mg_l=inputs["protection_threshold_mg_l"],
        critical_threshold_mg_l=inputs["critical_threshold_mg_l"],
    )
    simulation["scenario"]["risk_reference_strategy"] = "no_generator"
    optimization = optimize_allocation(
        ponds,
        generator_capacity_kw=inputs["generator_capacity_kw"],
        outage_hours=inputs["outage_hours"],
        target_do_mg_l=inputs["protection_threshold_mg_l"],
        time_step_minutes=inputs["time_step_minutes"],
        available_energy_kwh=inputs["available_energy_kwh"],
    )
    first_pond = next(
        pond for pond in simulation["ponds"]
        if pond["pond_id"] == simulation["summary"]["highest_priority_pond"]
    )
    return {
        "scenario": {
            "id": scenario_id,
            "name": scenario["name"],
            "classification": scenario["classification"],
        },
        "inputs": inputs,
        "simulation": simulation,
        "optimization": optimization,
        "decision": {
            "first_attention_pond": {
                "pond_id": first_pond["pond_id"],
                "risk": first_pond["risk"],
                "minimum_do_mg_l": first_pond["minimum_do_mg_l"],
            },
            "allocation_explanation": optimization["allocation_explanation"],
            "constraint_summary": optimization["constraint_summary"],
            "strategy_analysis": optimization["strategy_analysis"],
            "classification": "SIMULATED",
        },
        "data_sources": {
            "simulated_estimates": True,
            "user_entered_planning_inputs": False,
            "actual_sensor_readings_supported": False,
        },
    }
