# AquaResQ model limitations

The API and demo outputs are simulated estimates, not sensor readings,
validated forecasts, or operating instructions. The current model is suitable
only for illustrating software behavior with explicitly supplied assumptions.

## Scientific and data limitations

- No AquaResQ model parameter or demo scenario is documented as calibrated
  against measured shrimp-farm data or independently validated.
- Oxygen demand, respiration, photosynthesis, reaeration, saturation, and
  mechanical aeration rates are user inputs or illustrative defaults. Their
  temperature, salinity, species, life-stage, feeding, biomass, and farm
  dependencies are not estimated.
- Mechanical aeration's oxygen-addition rate is not derived from aerator type,
  power, depth, transfer efficiency, pond geometry, or measured oxygen transfer.
- A pond is treated as fully mixed. Local low-oxygen zones, vertical gradients,
  circulation, inflows/outflows, water exchange, and spatial aerator effects are
  absent.
- Rates are constant over the outage; changing light, feeding, weather,
  temperature, salinity, biomass, equipment state, and sensor observations are
  not represented.
- The non-negative DO floor is a numerical/physical bound, not a calibrated
  low-oxygen response model. There is no upper saturation cap or gas-transfer
  model for supersaturated water.
- Trajectory samples are discrete. Deficit and time-below-threshold metrics use
  linear interpolation between samples; their numerical values can therefore
  depend on the selected time step, particularly when rates change DO rapidly.

## Optimizer and operational limitations

- Aerator packages are binary and whole-pond; partial-power sharing,
  switching schedules, startup loads, wiring, pump/aerator reliability,
  generator derating, and voltage/frequency constraints are not modeled.
- Estimated energy is continuous full-load kW × outage hours. Available energy
  is an input in kWh; the application does not infer usable energy from fuel
  volume or account for generator efficiency, reserve fuel, or variable loads.
- The optimizer's lexicographic order is a transparent software policy, not a
  validated welfare function. It optimizes integrated deficit first; other
  reported metrics, including pond-hours below threshold, can disagree.
- Pareto comparisons cover only the three displayed policies and the supplied
  model objectives. They do not prove global operational superiority.
- The risk labels and thresholds are configurable classifications; they do not
  predict shrimp survival, mortality, or biological harm.
- There is no real-time sensor integration. User-entered planning values and
  simulation results must not be presented as live farm measurements.

## Validation required before any operational use

Use would require aquaculture and engineering review; pond- and species-specific
parameter measurement; calibration against independent time-series DO data;
testing across relevant temperature, salinity, biomass, weather, and outage
conditions; sensitivity and uncertainty analysis; and validation of generator,
fuel, and aerator performance. Safety thresholds and response guidance require
local expert validation. None of those validations is established by the
current codebase or the general references listed in
[SCIENTIFIC_AUDIT.md](./SCIENTIFIC_AUDIT.md).
