import unittest
from oxygen_model import Pond
from risk_engine import analyze_farm, classify_risk


class RiskEngineTests(unittest.TestCase):
    def test_classification(self):
        self.assertEqual(classify_risk(2.8), "CRITICAL")
        self.assertEqual(classify_risk(3.5), "HIGH")
        self.assertEqual(classify_risk(4.5), "MODERATE")
        self.assertEqual(classify_risk(5.2), "LOW")

    def test_invalid_threshold_order_rejected(self):
        with self.assertRaises(ValueError):
            classify_risk(4.0, alert_threshold_mg_l=3.0, critical_threshold_mg_l=3.5)

    def test_farm_ranking_and_summary(self):
        ponds = [
            Pond("A", 5000, 1.2, 6.0, 900),
            Pond("B", 3000, 1.0, 4.2, 1800, 0.12, 0.08, 0.30, 0, 0.01),
        ]
        report = analyze_farm(ponds, outage_hours=6)
        self.assertEqual(report["summary"]["pond_count"], 2)
        self.assertEqual(len(report["ponds"]), 2)
        self.assertIn(report["ponds"][0]["risk"], ["CRITICAL", "HIGH", "MODERATE", "LOW"])
        self.assertEqual(sum(report["summary"]["risk_counts"].values()), 2)

    def test_empty_farm_rejected(self):
        with self.assertRaises(ValueError):
            analyze_farm([])


if __name__ == "__main__":
    unittest.main()
