# AquaResQ model assumptions

This document records assumptions encoded by the current simulation. It does
not claim those assumptions are experimentally established for any farm.

## Dissolved-oxygen model

- Each pond is a single, completely mixed volume represented by
  `area_m2 × average_depth_m`; spatial and vertical gradients are omitted.
- Pond volume is treated as constant throughout an outage.
- Photosynthesis, water-column demand, sediment demand, shrimp respiration,
  natural reaeration coefficient, saturation DO, and mechanical aeration output
  are constant during one simulation.
- Shrimp respiration is calculated as supplied biomass (kg) times a supplied
  specific rate (mg O₂/kg/h), divided by pond volume in liters.
- Natural reaeration is represented as a first-order term,
  `kLa × (saturation_DO − DO)`.
- Mechanical aeration is a separate, constant oxygen-addition rate in mg/L/h
  whenever the package is allocated. The model does not derive this rate from
  electrical load.
- Predicted DO is not allowed below zero. There is no upper saturation cap;
  supersaturation is possible if supplied oxygen inputs imply it.
- The differential equation is advanced exactly over each time interval for
  its constant coefficients. The requested time step controls report sampling;
  integrated metrics are approximated from those sampled values using
  piecewise-linear interpolation and trapezoidal integration.
- Risk is assigned from minimum predicted DO using user-configured thresholds.
  Thresholds are decision settings, not model-derived biological outcomes.

## Allocation and energy

- Each pond receives either its configured full aerator package or none.
- Generator capacity is the sum of allocated package kW.
- Energy use assumes every selected package runs continuously for the full
  outage: `allocated_kW × outage_hours`.
- Available fuel energy, when given, is treated directly as a hard kWh limit.
  Fuel volume, generator conversion efficiency, start-up behavior, and changing
  load are not modeled.
- The recommendation is a deterministic lexicographic optimization, not a
  weighted compromise: minimize integrated oxygen deficit; then maximize the
  worst pond minimum DO; then maximize total modeled DO exposure; then minimize
  generator power.
- The baseline strategy allocates packages by ascending initial DO, subject to
  capacity and energy constraints. The no-generator, baseline, and optimized
  strategies use common pond inputs, simulation settings, and output metrics.

## Demo inputs and evidence

The three demo cases contain hand-authored illustrative inputs and are
reproducible for the same application version. They are not observations,
sensor readings, farm validation data, or published biological parameters.
General pond-water-quality references are listed in
[SCIENTIFIC_AUDIT.md](./SCIENTIFIC_AUDIT.md); they do not establish the numeric
rates or assumptions listed above.
