from dataclasses import dataclass
from math import ceil, expm1
from typing import Dict, Any


@dataclass
class Pond:
    pond_id: str
    area_m2: float
    average_depth_m: float
    initial_do_mg_l: float
    biomass_kg: float
    water_column_demand_mg_l_h: float = 0.05
    sediment_demand_mg_l_h: float = 0.03
    shrimp_respiration_mg_kg_h: float = 0.20
    photosynthesis_mg_l_h: float = 0.00
    reaeration_per_h: float = 0.05
    saturation_do_mg_l: float = 7.0
    aeration_addition_mg_l_h: float = 0.0
    aerator_load_kw: float = 0.0

    def validate(self) -> None:
        if not self.pond_id.strip():
            raise ValueError("pond_id cannot be empty")
        for field in ("area_m2", "average_depth_m", "initial_do_mg_l"):
            if getattr(self, field) <= 0:
                raise ValueError(f"{field} must be greater than zero")
        for field in (
            "biomass_kg", "water_column_demand_mg_l_h",
            "sediment_demand_mg_l_h", "shrimp_respiration_mg_kg_h",
            "photosynthesis_mg_l_h", "reaeration_per_h",
            "aeration_addition_mg_l_h", "aerator_load_kw"
        ):
            if getattr(self, field) < 0:
                raise ValueError(f"{field} cannot be negative")


def oxygen_rate(pond: Pond, do_mg_l: float, aeration_on: bool) -> float:
    volume_m3 = pond.area_m2 * pond.average_depth_m
    shrimp_demand_mg_l_h = (
        pond.biomass_kg * pond.shrimp_respiration_mg_kg_h
        / (volume_m3 * 1000.0)
    )
    natural_reaeration = pond.reaeration_per_h * (
        pond.saturation_do_mg_l - do_mg_l
    )
    mechanical_aeration = pond.aeration_addition_mg_l_h if aeration_on else 0.0
    return (
        pond.photosynthesis_mg_l_h + natural_reaeration + mechanical_aeration
        - pond.water_column_demand_mg_l_h - pond.sediment_demand_mg_l_h
        - shrimp_demand_mg_l_h
    )


def _advance_oxygen(pond: Pond, do_mg_l: float, aeration_on: bool, dt_h: float) -> float:
    non_reaeration_rate = (
        pond.photosynthesis_mg_l_h
        + (pond.aeration_addition_mg_l_h if aeration_on else 0.0)
        - pond.water_column_demand_mg_l_h
        - pond.sediment_demand_mg_l_h
        - pond.biomass_kg * pond.shrimp_respiration_mg_kg_h
        / (pond.area_m2 * pond.average_depth_m * 1000.0)
    )
    reaeration_per_h = pond.reaeration_per_h
    if reaeration_per_h == 0:
        return max(0.0, do_mg_l + non_reaeration_rate * dt_h)

    one_minus_decay = -expm1(-reaeration_per_h * dt_h)
    next_do = (
        do_mg_l
        + (pond.saturation_do_mg_l - do_mg_l) * one_minus_decay
        + non_reaeration_rate * one_minus_decay / reaeration_per_h
    )
    return max(0.0, next_do)


def simulate_pond(
    pond: Pond,
    outage_hours: float = 6.0,
    time_step_minutes: int = 5,
    alert_threshold_mg_l: float = 4.0,
    aeration_available: bool = False,
) -> Dict[str, Any]:
    pond.validate()
    if outage_hours <= 0:
        raise ValueError("outage_hours must be greater than zero")
    if time_step_minutes <= 0 or time_step_minutes > 60:
        raise ValueError("time_step_minutes must be between 1 and 60")
    if alert_threshold_mg_l <= 0:
        raise ValueError("alert_threshold_mg_l must be greater than zero")

    step_h = time_step_minutes / 60.0
    steps = ceil(outage_hours / step_h)
    do = pond.initial_do_mg_l
    trajectory = []

    for step in range(steps + 1):
        time_h = min(step * step_h, outage_hours)
        trajectory.append({"time_hours": round(time_h, 6), "do_mg_l": round(do, 6)})
        if step == steps:
            break
        actual_dt_h = min(step_h, outage_hours - time_h)
        do = _advance_oxygen(pond, do, aeration_available, actual_dt_h)

    values = [point["do_mg_l"] for point in trajectory]
    time_to_alert = None
    if values[0] <= alert_threshold_mg_l:
        time_to_alert = 0.0
    else:
        for left, right in zip(trajectory, trajectory[1:]):
            left_do = left["do_mg_l"]
            right_do = right["do_mg_l"]
            if left_do > alert_threshold_mg_l >= right_do:
                fraction = (left_do - alert_threshold_mg_l) / (left_do - right_do)
                crossing_time = left["time_hours"] + fraction * (
                    right["time_hours"] - left["time_hours"]
                )
                time_to_alert = round(crossing_time, 3)
                break

    return {
        "pond_id": pond.pond_id,
        "outage_hours": outage_hours,
        "initial_do_mg_l": pond.initial_do_mg_l,
        "final_do_mg_l": values[-1],
        "minimum_do_mg_l": min(values),
        "alert_threshold_mg_l": alert_threshold_mg_l,
        "time_to_alert_hours": time_to_alert,
        "trajectory": trajectory,
        "aeration_supplied": aeration_available,
        "model_label": "SIMULATED — illustrative parameters; not field validated",
    }


def classify_risk(predicted_do_mg_l, alert_threshold_mg_l=4.0):
    # Backward compatibility with the original Milestone 1 tests.
    if predicted_do_mg_l <= 3.0:
        return "CRITICAL"
    if predicted_do_mg_l < alert_threshold_mg_l:
        return "HIGH"
    if predicted_do_mg_l < alert_threshold_mg_l + 1.0:
        return "MODERATE"
    return "LOW"
