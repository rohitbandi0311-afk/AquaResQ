from typing import List, Dict, Any
from oxygen_model import Pond, simulate_pond


def classify_risk(minimum_do_mg_l, alert_threshold_mg_l=4.0, critical_threshold_mg_l=3.0):
    if critical_threshold_mg_l <= 0 or alert_threshold_mg_l <= critical_threshold_mg_l:
        raise ValueError("Require 0 < critical threshold < alert threshold")
    if minimum_do_mg_l <= critical_threshold_mg_l:
        return "CRITICAL"
    if minimum_do_mg_l < alert_threshold_mg_l:
        return "HIGH"
    if minimum_do_mg_l < alert_threshold_mg_l + 1.0:
        return "MODERATE"
    return "LOW"


RISK_ORDER = {"CRITICAL": 0, "HIGH": 1, "MODERATE": 2, "LOW": 3}


def analyze_farm(ponds: List[Pond], outage_hours=6.0, time_step_minutes=5,
                 alert_threshold_mg_l=4.0, critical_threshold_mg_l=3.0):
    if not ponds:
        raise ValueError("At least one pond is required")
    pond_results = []
    for pond in ponds:
        result = simulate_pond(pond, outage_hours, time_step_minutes, alert_threshold_mg_l)
        result["risk"] = classify_risk(result["minimum_do_mg_l"],
                                       alert_threshold_mg_l, critical_threshold_mg_l)
        pond_results.append(result)
    pond_results.sort(key=lambda item: (
        RISK_ORDER[item["risk"]],
        item["time_to_alert_hours"] if item["time_to_alert_hours"] is not None else float("inf"),
        item["minimum_do_mg_l"],
    ))
    counts = {risk: 0 for risk in RISK_ORDER}
    for result in pond_results:
        counts[result["risk"]] += 1
    return {
        "scenario": {"outage_hours": outage_hours, "time_step_minutes": time_step_minutes,
                     "alert_threshold_mg_l": alert_threshold_mg_l,
                     "critical_threshold_mg_l": critical_threshold_mg_l},
        "summary": {"pond_count": len(pond_results), "risk_counts": counts,
                    "highest_priority_pond": pond_results[0]["pond_id"]},
        "ponds": pond_results,
        "disclaimer": "SIMULATED DEMO ONLY; parameters are illustrative and unvalidated."
    }
