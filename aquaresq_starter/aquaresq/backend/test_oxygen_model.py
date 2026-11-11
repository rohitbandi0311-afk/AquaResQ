import unittest
from math import exp
from oxygen_model import Pond, simulate_pond, classify_risk


class OxygenModelTests(unittest.TestCase):
    def make_pond(self):
        return Pond(
            pond_id="TEST", area_m2=5000, average_depth_m=1.2,
            initial_do_mg_l=6.0, biomass_kg=1000,
            water_column_demand_mg_l_h=0.05,
            sediment_demand_mg_l_h=0.03,
            shrimp_respiration_mg_kg_h=0.2,
            reaeration_per_h=0.05,
        )

    def test_simulation_returns_time_series(self):
        result = simulate_pond(self.make_pond(), outage_hours=2)
        self.assertEqual(result["pond_id"], "TEST")
        self.assertEqual(len(result["trajectory"]), 25)  # 5-minute steps
        self.assertGreaterEqual(result["final_do_mg_l"], 0)

    def test_zero_or_negative_area_rejected(self):
        pond = self.make_pond()
        pond.area_m2 = 0
        with self.assertRaises(ValueError):
            simulate_pond(pond)

    def test_risk_thresholds(self):
        self.assertEqual(classify_risk(2.5), "CRITICAL")
        self.assertEqual(classify_risk(3.5), "HIGH")
        self.assertEqual(classify_risk(4.5), "MODERATE")
        self.assertEqual(classify_risk(5.5), "LOW")

    def test_exact_reaeration_step_remains_stable_for_large_coefficient(self):
        pond = Pond(
            "FAST-REAERATION", 100, 1, 2, 0,
            water_column_demand_mg_l_h=0,
            sediment_demand_mg_l_h=0,
            shrimp_respiration_mg_kg_h=0,
            reaeration_per_h=3,
            saturation_do_mg_l=7,
        )
        coarse = simulate_pond(pond, outage_hours=2, time_step_minutes=60)
        fine = simulate_pond(pond, outage_hours=2, time_step_minutes=5)
        expected = 7 + (2 - 7) * exp(-6)
        self.assertAlmostEqual(coarse["final_do_mg_l"], expected, places=6)
        self.assertEqual(coarse["final_do_mg_l"], fine["final_do_mg_l"])
        self.assertGreaterEqual(coarse["minimum_do_mg_l"], 2)

    def test_alert_time_interpolates_between_samples(self):
        pond = Pond(
            "CROSSING", 100, 1, 5, 0,
            water_column_demand_mg_l_h=0.75,
            sediment_demand_mg_l_h=0,
            shrimp_respiration_mg_kg_h=0,
            reaeration_per_h=0,
        )
        result = simulate_pond(
            pond, outage_hours=2, time_step_minutes=60,
            alert_threshold_mg_l=4,
        )
        self.assertEqual(result["time_to_alert_hours"], 1.333)

    def test_alert_time_is_zero_when_initially_below_threshold_and_none_when_never_crossed(self):
        pond = self.make_pond()
        pond.initial_do_mg_l = 3.5
        below = simulate_pond(pond, outage_hours=1, alert_threshold_mg_l=4)
        self.assertEqual(below["time_to_alert_hours"], 0.0)

        pond.initial_do_mg_l = 6.0
        pond.water_column_demand_mg_l_h = 0
        pond.sediment_demand_mg_l_h = 0
        pond.shrimp_respiration_mg_kg_h = 0
        pond.reaeration_per_h = 0
        above = simulate_pond(pond, outage_hours=1, alert_threshold_mg_l=4)
        self.assertIsNone(above["time_to_alert_hours"])


if __name__ == "__main__":
    unittest.main()
