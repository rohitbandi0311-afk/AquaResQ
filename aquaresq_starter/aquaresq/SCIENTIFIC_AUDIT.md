# AquaResQ scientific and technical audit

## Scope and conclusion

Reviewed `backend/oxygen_model.py`, `optimizer.py`, `risk_engine.py`,
`demo_scenarios.py`, `main.py`, and the associated backend tests and API
documentation. The model is a deterministic, lumped-pond planning simulation.
Its equation structure is dimensionally coherent as implemented, but its
parameters and outputs are not field-validated and should not be used as
operating advice.

The audit found and corrected three reproducible defects:

1. **Time-step instability in oxygen integration.** The previous explicit
   Euler step could overshoot and oscillate for allowed `reaeration_per_h`
   inputs. For example, a coefficient of 3 h⁻¹ with a 1-hour step changed a
   pond from 2 to 17 and then 0 mg/L, although the specified first-order
   reaeration equation approaches its saturation value monotonically. The
   model now advances the constant-coefficient first-order equation
   analytically over each interval, retaining the existing zero-DO floor.
2. **Alert-time quantization.** `time_to_alert_hours` previously returned the
   first sampled time at or below the threshold, potentially reporting a
   later alert by as much as one time step. It now linearly interpolates the
   crossing between the recorded trajectory samples, consistent with the
   optimizer's threshold-time calculation.
3. **Invalid risk-threshold request handling.** A request with a critical
   threshold at or above the alert threshold passed Pydantic validation and
   raised an uncaught `ValueError` during simulation. Request validation now
   rejects that combination with HTTP 422; backend classification remains
   strict.

An independent small-case exhaustive test also checks the optimizer's selected
allocation against every feasible binary pond-package subset under power and
energy limits. No mismatch was found. The optimizer uses the stated
lexicographic rule: minimize total integrated oxygen deficit, then maximize
worst-pond minimum DO, maximize total modeled DO exposure, and minimize
generator power. Pond-hours below threshold and threshold-crossing count are
reported in the strategy comparison but are not selection criteria. This is a
policy choice, not a scientific finding that the selected strategy is
universally superior.

## Model equation and unit audit

The implementation calculates pond volume as area × average depth in m³, then
uses 1,000 L/m³ to convert it to liters. The shrimp respiration contribution is

`biomass_kg × respiration_mg_per_kg_per_h ÷ pond_volume_L`,

which has units mg/L/h. Water-column demand, sediment demand, photosynthesis,
natural reaeration, and configured mechanical aeration are also represented as
rates in mg/L/h. The implemented net rate is:

`dDO/dt = photosynthesis + kLa × (saturation_DO − DO) + mechanical_aeration − water_demand − sediment_demand − shrimp_demand`.

With the model's rates held constant over a time interval, the implementation
now uses the exact update for this linear differential equation. Let `b` be
the sum of all non-reaeration rates, `k = kLa`, and `dt` be the interval in
hours:

`DO(t+dt) = DO(t) + (saturation_DO − DO(t)) × (1 − exp(−k×dt)) + b/k × (1 − exp(−k×dt))`

when `k > 0`; when `k = 0`, it uses `DO(t+dt) = DO(t) + b×dt`. The
implementation evaluates the exponential difference with `expm1` to avoid
loss of precision for small `k×dt`. It floors the resulting DO at zero.
Trajectories remain sampled at the requested time step; integrated deficit and
time below threshold are estimated from each adjacent pair using linear
interpolation/trapezoidal integration.

No evidence of a coding-level double count was found: natural reaeration and
the separately configured mechanical-aeration rate are distinct terms. That
does not establish that user-supplied water-column, sediment, respiration,
photosynthesis, or aeration rates are independent in a real pond. Their
measurement and calibration are outside the repository.

Generator feasibility is checked against the sum of whole-pond package loads
in kW and, when supplied, against `allocated_kW × outage_hours` in kWh. This
energy calculation assumes continuous operation for the full outage. The
application accepts available energy directly; it does not convert fuel
volume to electrical energy or model generator efficiency.

Risk classes are derived from minimum simulated DO and configurable alert and
critical thresholds. They are model classifications, not validated biological
outcome or mortality predictions.

## Published evidence versus project evidence

Published aquaculture references support the general relevance of dissolved
oxygen, pond water quality, and pond management. Standard mass-balance
dimensional analysis supports the units and first-order transfer form used
here. The references below do **not** validate AquaResQ's parameter values,
the constant-rate assumptions, or its predictions for a particular shrimp
farm:

- Boyd, C. E. and Tucker, C. S. (1998). *Pond Aquaculture Water Quality
  Management*. Springer US. [https://doi.org/10.1007/978-1-4615-5407-3](https://doi.org/10.1007/978-1-4615-5407-3).
- Kumar, D. (1992). *Fish Culture in Undrainable Ponds: A Manual for
  Extension*. FAO Fisheries Technical Paper 325. [FAO publication](https://www.fao.org/4/t0555e/t0555e00.htm).

The FAO manual concerns pond fish culture and is cited only for general pond
water-quality and management context, not as evidence for vannamei-specific
rates or thresholds. AquaResQ's rates and demo inputs are illustrative
software assumptions unless a farm operator supplies them; no repository
evidence documents a field calibration or independent model validation.

## Regression verification

Added tests cover the unstable high-reaeration example and its analytical
solution, agreement of coarse and fine time-step endpoint estimates, an
interpolated alert crossing, initial-below/no-crossing alert cases, HTTP 422
for reversed thresholds, and brute-force optimizer comparison over small
feasible-allocation spaces. See the accompanying test run reported with this
audit for the executed results.
