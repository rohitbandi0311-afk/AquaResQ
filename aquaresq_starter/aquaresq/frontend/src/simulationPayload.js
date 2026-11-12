export function makeSimulationPayload(ponds, outageHours, alertThreshold = 4.0) {
  const thresholdText = String(alertThreshold).trim();
  const threshold = Number(thresholdText);
  if (!thresholdText || !Number.isFinite(threshold) || threshold <= 0) {
    throw new RangeError("Alert threshold must be a number greater than zero.");
  }

  return {
    // Keep the simulation screen's model inputs identical to the pond profile
    // and optimizer inputs. Omitting these fields silently selects backend
    // defaults and can produce a different trajectory for the same pond.
    ponds: ponds.map((pond) => ({
      pond_id: pond.pond_id,
      area_m2: pond.area_m2,
      average_depth_m: pond.average_depth_m,
      initial_do_mg_l: pond.initial_do_mg_l,
      biomass_kg: pond.biomass_kg,
      water_column_demand_mg_l_h: pond.water_column_demand_mg_l_h,
      sediment_demand_mg_l_h: pond.sediment_demand_mg_l_h,
      shrimp_respiration_mg_kg_h: pond.shrimp_respiration_mg_kg_h,
      photosynthesis_mg_l_h: pond.photosynthesis_mg_l_h,
      reaeration_per_h: pond.reaeration_per_h,
      saturation_do_mg_l: pond.saturation_do_mg_l,
      aeration_addition_mg_l_h: pond.aeration_addition_mg_l_h,
      aerator_load_kw: pond.aerator_load_kw
    })),
    outage_hours: Number(outageHours),
    time_step_minutes: 5,
    alert_threshold_mg_l: threshold,
    critical_threshold_mg_l: 3
  };
}
