import json
from pathlib import Path

from oxygen_model import Pond
from optimizer import optimize_allocation

demo = json.loads(
    Path(__file__).with_name("demo_optimizer_request.json").read_text(
        encoding="utf-8"
    )
)
request = demo["request"]
ponds = [Pond(**pond_data) for pond_data in request["ponds"]]

result = optimize_allocation(
    ponds,
    generator_capacity_kw=request["generator_capacity_kw"],
    outage_hours=request["outage_hours"],
    target_do_mg_l=request["target_do_mg_l"],
    time_step_minutes=request["time_step_minutes"],
    available_energy_kwh=request["available_energy_kwh"],
)

print(f"\n=== AQUARESQ | {demo['classification']} ===")
print(f"Generator capacity: {result['generator_capacity_kw']} kW")
print(f"Allocated load: {result['allocated_power_kw']} kW")
print(f"Estimated energy: {result['estimated_energy_kwh']} kWh")
print(f"Feasible plans evaluated: {result['feasible_allocations_evaluated']}")
print("\nRecommended simulated allocation:")
for item in result["allocation"]:
    status = "ALLOCATED" if item["aerator_allocated"] else "NOT ALLOCATED"
    print(
        f"{item['pond_id']}: {status} | load={item['aerator_load_kw']:.1f} kW | "
        f"minimum predicted DO={item['minimum_do_mg_l']:.2f} mg/L"
    )
print("\n" + result["disclaimer"])
