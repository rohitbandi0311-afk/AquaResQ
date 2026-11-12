import assert from "node:assert/strict";
import test from "node:test";
import { makeSimulationPayload } from "./simulationPayload.js";

const ponds = [{
  pond_id: "P1",
  area_m2: 5000,
  average_depth_m: 1.2,
  initial_do_mg_l: 5.2,
  biomass_kg: 1200,
  water_column_demand_mg_l_h: 0.12,
  sediment_demand_mg_l_h: 0.12,
  shrimp_respiration_mg_kg_h: 0.8,
  photosynthesis_mg_l_h: 0.0,
  reaeration_per_h: 0.05,
  saturation_do_mg_l: 7.0,
  aeration_addition_mg_l_h: 0.55,
  aerator_load_kw: 2.0
}];

test("simulation payload defaults to the configured 4.0 mg/L threshold", () => {
  assert.equal(makeSimulationPayload(ponds, 6).alert_threshold_mg_l, 4.0);
});

test("simulation payload preserves an explicitly configured threshold", () => {
  assert.equal(makeSimulationPayload(ponds, 6, "4.6").alert_threshold_mg_l, 4.6);
});

test("simulation payload preserves every configured oxygen-model and aerator parameter", () => {
  const payload = makeSimulationPayload(ponds, 6);
  assert.deepEqual(payload.ponds[0], ponds[0]);
  assert.equal(payload.outage_hours, 6);
  assert.equal(payload.time_step_minutes, 5);
});

test("simulation payload does not silently replace custom parameters with backend defaults", () => {
  const customPond = {
    ...ponds[0],
    water_column_demand_mg_l_h: 0.31,
    sediment_demand_mg_l_h: 0.27,
    shrimp_respiration_mg_kg_h: 1.4,
    photosynthesis_mg_l_h: 0.08,
    reaeration_per_h: 0.11,
    saturation_do_mg_l: 7.8,
    aeration_addition_mg_l_h: 0.72,
    aerator_load_kw: 3.0
  };
  const payload = makeSimulationPayload([customPond], 12);
  assert.deepEqual(payload.ponds[0], customPond);
});

test("simulation payload rejects empty, invalid, zero, and negative thresholds", () => {
  for (const threshold of ["", "not-a-number", "0", "-1"]) {
    assert.throws(
      () => makeSimulationPayload(ponds, 6, threshold),
      { name: "RangeError" }
    );
  }
});
