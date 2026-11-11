export function makeSimulationPayload(ponds, outageHours, alertThreshold = 4.0) {
  const thresholdText = String(alertThreshold).trim();
  const threshold = Number(thresholdText);
  if (!thresholdText || !Number.isFinite(threshold) || threshold <= 0) {
    throw new RangeError("Alert threshold must be a number greater than zero.");
  }

  return {
    ponds: ponds.map(({ pond_id, area_m2, average_depth_m, initial_do_mg_l, biomass_kg }) => ({
      pond_id, area_m2, average_depth_m, initial_do_mg_l, biomass_kg
    })),
    outage_hours: Number(outageHours),
    time_step_minutes: 5,
    alert_threshold_mg_l: threshold,
    critical_threshold_mg_l: 3
  };
}
