import unittest
from fastapi.testclient import TestClient
from main import app, parse_cors_origins
from oxygen_model import Pond, simulate_pond
from risk_engine import classify_risk

client = TestClient(app)


class ApiTests(unittest.TestCase):
    def test_cors_origins_default_to_local_development_origins(self):
        self.assertEqual(
            parse_cors_origins(None),
            ["http://localhost:5173", "http://127.0.0.1:5173"],
        )

    def test_cors_origins_accept_exact_configured_production_origins(self):
        self.assertEqual(
            parse_cors_origins(
                " https://aqua.example,https://farm.example/,https://aqua.example "
            ),
            ["https://aqua.example", "https://farm.example"],
        )

    def test_cors_origins_reject_wildcards_credentials_and_paths(self):
        for configured in (
            "*",
            "https://user:password@example.com",
            "https://example.com/dashboard",
            "ftp://example.com",
            "https://example.com:not-a-port",
            "https://bad host.example",
        ):
            with self.subTest(configured=configured):
                with self.assertRaises(ValueError):
                    parse_cors_origins(configured)

    def test_health(self):
        response = client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "healthy")

    def test_root(self):
        response = client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["name"], "AquaResQ API")

    def test_simulation_endpoint(self):
        payload = {
            "outage_hours": 2,
            "ponds": [{
                "pond_id": "P1",
                "area_m2": 5000,
                "average_depth_m": 1.2,
                "initial_do_mg_l": 5.5,
                "biomass_kg": 1000
            }]
        }
        response = client.post("/simulate", json=payload)
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["summary"]["pond_count"], 1)
        self.assertEqual(body["scenario"]["alert_threshold_mg_l"], 4.0)

    def test_zero_alert_threshold_is_rejected(self):
        payload = {
            "alert_threshold_mg_l": 0,
            "ponds": [{
                "pond_id": "P1",
                "area_m2": 5000,
                "average_depth_m": 1.2,
                "initial_do_mg_l": 5.5,
                "biomass_kg": 1000
            }]
        }
        response = client.post("/simulate", json=payload)
        self.assertEqual(response.status_code, 422)

    def test_reversed_risk_thresholds_are_rejected_as_validation_error(self):
        payload = {
            "alert_threshold_mg_l": 3.0,
            "critical_threshold_mg_l": 3.5,
            "ponds": [{
                "pond_id": "P1",
                "area_m2": 5000,
                "average_depth_m": 1.2,
                "initial_do_mg_l": 5.5,
                "biomass_kg": 1000
            }]
        }
        response = client.post("/simulate", json=payload)
        self.assertEqual(response.status_code, 422)
        self.assertIn("critical threshold", response.json()["detail"][0]["msg"])

    def test_duplicate_pond_ids_rejected(self):
        pond = {
            "pond_id": "P1", "area_m2": 5000, "average_depth_m": 1.2,
            "initial_do_mg_l": 5.5, "biomass_kg": 1000
        }
        response = client.post("/simulate", json={"ponds": [pond, pond]})
        self.assertEqual(response.status_code, 422)

    def test_optimize_passes_aerator_power_and_oxygen_output(self):
        ponds = [{
            "pond_id": f"P{i}",
            "area_m2": 5000,
            "average_depth_m": 1.2,
            "initial_do_mg_l": 5.0,
            "biomass_kg": 1000,
            "aerator_load_kw": 2,
            "aeration_addition_mg_l_h": 0.4
        } for i in range(1, 4)]
        response = client.post("/optimize", json={
            "ponds": ponds,
            "generator_capacity_kw": 4,
            "outage_hours": 6,
            "target_do_mg_l": 4
        })
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual(result["allocated_power_kw"], 4)
        self.assertEqual(
            sum(item["aerator_allocated"] for item in result["allocation"]), 2
        )
        self.assertEqual(len(result["comparison_strategies"]), 3)
        optimized = result["comparison_strategies"][2]
        self.assertEqual(optimized["generator_power_kw"], 4)
        self.assertEqual(len(optimized["ponds"][0]["trajectory"]), 73)

    def test_demo_scenario_catalog_has_three_simulated_scenarios(self):
        response = client.get("/demo-scenarios")
        self.assertEqual(response.status_code, 200)
        scenarios = response.json()["scenarios"]
        self.assertEqual(
            [scenario["id"] for scenario in scenarios],
            ["normal", "moderate", "critical"],
        )
        self.assertTrue(all(s["classification"] == "SIMULATED" for s in scenarios))

    def test_each_demo_scenario_is_complete_consistent_and_reproducible(self):
        for scenario_id in ("normal", "moderate", "critical"):
            with self.subTest(scenario=scenario_id):
                first_response = client.post(f"/demo-scenarios/{scenario_id}/run")
                second_response = client.post(f"/demo-scenarios/{scenario_id}/run")
                self.assertEqual(first_response.status_code, 200)
                self.assertEqual(first_response.json(), second_response.json())
                result = first_response.json()
                inputs = result["inputs"]
                simulation = result["simulation"]
                optimization = result["optimization"]
                self.assertEqual(result["scenario"]["classification"], "SIMULATED")
                self.assertTrue(result["data_sources"]["simulated_estimates"])
                self.assertFalse(result["data_sources"]["actual_sensor_readings_supported"])
                self.assertEqual(len(inputs["ponds"]), 3)
                self.assertTrue(all(p["aerator_load_kw"] > 0 for p in inputs["ponds"]))
                self.assertTrue(all(p["aeration_addition_mg_l_h"] > 0 for p in inputs["ponds"]))
                self.assertEqual(simulation["scenario"]["outage_hours"], inputs["outage_hours"])
                self.assertEqual(
                    simulation["scenario"]["alert_threshold_mg_l"],
                    inputs["protection_threshold_mg_l"],
                )
                self.assertEqual(
                    simulation["scenario"]["risk_reference_strategy"], "no_generator"
                )
                self.assertEqual(optimization["outage_hours"], inputs["outage_hours"])
                self.assertEqual(
                    optimization["generator_capacity_kw"],
                    inputs["generator_capacity_kw"],
                )
                self.assertEqual(
                    optimization["available_energy_kwh"],
                    inputs["available_energy_kwh"],
                )
                self.assertEqual(len(optimization["comparison_strategies"]), 3)
                self.assertTrue(all(
                    strategy["capacity_respected"]
                    and strategy["fuel_energy_respected"]
                    for strategy in optimization["comparison_strategies"]
                ))
                self.assertEqual(
                    optimization["constraint_summary"]["total_allocations_considered"],
                    optimization["constraint_summary"]["feasible_allocations_evaluated"]
                    + optimization["constraint_summary"]["generator_capacity_rejections"]
                    + optimization["constraint_summary"]["fuel_energy_rejections"],
                )
                no_generator = optimization["comparison_strategies"][0]
                reference_ponds = {
                    pond["pond_id"]: pond for pond in no_generator["ponds"]
                }
                for pond in simulation["ponds"]:
                    reference = reference_ponds[pond["pond_id"]]
                    self.assertEqual(pond["trajectory"], reference["trajectory"])
                    self.assertEqual(pond["minimum_do_mg_l"], reference["minimum_do_mg_l"])
                for strategy in optimization["comparison_strategies"]:
                    strategy_ponds = {
                        pond["pond_id"]: pond for pond in strategy["ponds"]
                    }
                    for pond_input in inputs["ponds"]:
                        strategy_pond = strategy_ponds[pond_input["pond_id"]]
                        self.assertEqual(
                            strategy_pond["initial_do_mg_l"],
                            pond_input["initial_do_mg_l"],
                        )
                        self.assertEqual(
                            strategy_pond["trajectory"][-1]["time_hours"],
                            inputs["outage_hours"],
                        )
                        expected = simulate_pond(
                            Pond(**pond_input),
                            outage_hours=inputs["outage_hours"],
                            time_step_minutes=inputs["time_step_minutes"],
                            alert_threshold_mg_l=inputs["protection_threshold_mg_l"],
                            aeration_available=strategy_pond["aerator_allocated"],
                        )
                        self.assertEqual(
                            strategy_pond["trajectory"], expected["trajectory"]
                        )
                self.assertEqual(
                    result["decision"]["first_attention_pond"]["pond_id"],
                    simulation["summary"]["highest_priority_pond"],
                )
                self.assertEqual(
                    result["decision"]["strategy_analysis"],
                    optimization["strategy_analysis"],
                )
                self.assertEqual(
                    result["decision"]["allocation_explanation"],
                    optimization["allocation_explanation"],
                )
                optimized_strategy = optimization["comparison_strategies"][2]
                optimized_allocations = {
                    pond["pond_id"]: pond["aerator_allocated"]
                    for pond in optimized_strategy["ponds"]
                }
                self.assertEqual(
                    optimized_allocations,
                    {
                        pond["pond_id"]: pond["aerator_allocated"]
                        for pond in optimization["allocation"]
                    },
                )
                self.assertEqual(
                    optimization["allocated_power_kw"],
                    round(sum(
                        pond["aerator_load_kw"]
                        for pond in inputs["ponds"]
                        if optimized_allocations[pond["pond_id"]]
                    ), 3),
                )
                for pond in simulation["ponds"]:
                    self.assertEqual(
                        pond["risk"],
                        classify_risk(
                            pond["minimum_do_mg_l"],
                            inputs["protection_threshold_mg_l"],
                            inputs["critical_threshold_mg_l"],
                        ),
                    )

                directions = optimization["strategy_analysis"]["directions"]
                strategies = {
                    strategy["strategy"]: strategy
                    for strategy in optimization["comparison_strategies"]
                }
                dominators = {strategy_id: set() for strategy_id in strategies}
                for pair in optimization["strategy_analysis"]["pairwise_comparisons"]:
                    first = pair["first_objectives"]
                    second = pair["second_objectives"]
                    first_no_worse = all(
                        first[key] <= second[key] + 1e-8
                        if direction == "minimize"
                        else first[key] >= second[key] - 1e-8
                        for key, direction in directions.items()
                    )
                    second_no_worse = all(
                        second[key] <= first[key] + 1e-8
                        if direction == "minimize"
                        else second[key] >= first[key] - 1e-8
                        for key, direction in directions.items()
                    )
                    first_strict = any(
                        first[key] < second[key] - 1e-8
                        if direction == "minimize"
                        else first[key] > second[key] + 1e-8
                        for key, direction in directions.items()
                    )
                    second_strict = any(
                        second[key] < first[key] - 1e-8
                        if direction == "minimize"
                        else second[key] > first[key] + 1e-8
                        for key, direction in directions.items()
                    )
                    if first_no_worse and first_strict:
                        dominators[pair["second_strategy"]].add(pair["first_strategy"])
                        self.assertEqual(pair["relation"], "first_dominates")
                    elif second_no_worse and second_strict:
                        dominators[pair["first_strategy"]].add(pair["second_strategy"])
                        self.assertEqual(pair["relation"], "second_dominates")
                    elif all(abs(first[key] - second[key]) <= 1e-8 for key in directions):
                        self.assertEqual(pair["relation"], "equal")
                    else:
                        self.assertEqual(pair["relation"], "trade_off")
                for strategy_id, strategy in strategies.items():
                    self.assertEqual(
                        strategy["pareto_efficient"],
                        not dominators[strategy_id],
                    )

    def test_unknown_demo_scenario_returns_not_found(self):
        self.assertEqual(client.post("/demo-scenarios/not-a-scenario/run").status_code, 404)

    def test_zero_fuel_prevents_all_power_allocation(self):
        ponds = [{
            "pond_id": "P1", "area_m2": 5000, "average_depth_m": 1.2,
            "initial_do_mg_l": 5.0, "biomass_kg": 1000,
            "aerator_load_kw": 2, "aeration_addition_mg_l_h": 0.4,
        }]
        response = client.post("/optimize", json={
            "ponds": ponds, "generator_capacity_kw": 4,
            "outage_hours": 6, "available_energy_kwh": 0,
        })
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual(result["allocated_power_kw"], 0)
        self.assertEqual(result["estimated_energy_kwh"], 0)
        self.assertEqual(result["allocation_status"], "energy_limit")
        self.assertEqual(result["constraint_summary"]["fuel_energy_rejections"], 1)

    def test_no_configured_aerators_returns_no_packages(self):
        ponds = [{
            "pond_id": "P1", "area_m2": 5000, "average_depth_m": 1.2,
            "initial_do_mg_l": 5.0, "biomass_kg": 1000,
        }]
        response = client.post("/optimize", json={
            "ponds": ponds, "generator_capacity_kw": 4, "outage_hours": 6,
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["allocation_status"], "no_packages")
        self.assertEqual(response.json()["allocated_power_kw"], 0)

    def test_all_above_and_all_below_protection_threshold_have_matching_risk(self):
        for starting_do, expectation in ((6.0, "above"), (2.5, "below")):
            ponds = [{
                "pond_id": f"P{i}", "area_m2": 5000, "average_depth_m": 1.2,
                "initial_do_mg_l": starting_do, "biomass_kg": 100,
                "water_column_demand_mg_l_h": 0,
                "sediment_demand_mg_l_h": 0,
                "shrimp_respiration_mg_kg_h": 0,
                "reaeration_per_h": 0,
            } for i in range(1, 4)]
            response = client.post("/simulate", json={
                "ponds": ponds, "outage_hours": 1, "alert_threshold_mg_l": 4.0,
            })
            self.assertEqual(response.status_code, 200)
            for pond in response.json()["ponds"]:
                self.assertEqual(
                    pond["risk"],
                    classify_risk(pond["minimum_do_mg_l"], 4.0, 3.0),
                )
                if expectation == "above":
                    self.assertGreater(pond["minimum_do_mg_l"], 4.0)
                else:
                    self.assertLess(pond["minimum_do_mg_l"], 4.0)

    def test_invalid_and_missing_simulation_inputs_are_rejected(self):
        valid_pond = {
            "pond_id": "P1", "area_m2": 5000, "average_depth_m": 1.2,
            "initial_do_mg_l": 5.0, "biomass_kg": 1000,
        }
        missing_required_field = {key: value for key, value in valid_pond.items() if key != "area_m2"}
        self.assertEqual(
            client.post("/simulate", json={"ponds": [missing_required_field]}).status_code,
            422,
        )
        invalid_value = {**valid_pond, "initial_do_mg_l": -1}
        self.assertEqual(
            client.post("/simulate", json={"ponds": [invalid_value]}).status_code,
            422,
        )


if __name__ == "__main__":
    unittest.main()
