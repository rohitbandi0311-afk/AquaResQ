import assert from "node:assert/strict";
import test from "node:test";
import { makeSimulationPayload } from "./simulationPayload.js";

const ponds = [{
  pond_id: "P1",
  area_m2: 5000,
  average_depth_m: 1.2,
  initial_do_mg_l: 5.2,
  biomass_kg: 1200
}];

test("simulation payload defaults to the configured 4.0 mg/L threshold", () => {
  assert.equal(makeSimulationPayload(ponds, 6).alert_threshold_mg_l, 4.0);
});

test("simulation payload preserves an explicitly configured threshold", () => {
  assert.equal(makeSimulationPayload(ponds, 6, "4.6").alert_threshold_mg_l, 4.6);
});

test("simulation payload rejects empty, invalid, zero, and negative thresholds", () => {
  for (const threshold of ["", "not-a-number", "0", "-1"]) {
    assert.throws(
      () => makeSimulationPayload(ponds, 6, threshold),
      { name: "RangeError" }
    );
  }
});
