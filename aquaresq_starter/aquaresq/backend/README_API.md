# AquaResQ API — Milestone 4

## Install
Open a terminal in this `backend` folder:

```powershell
py -m pip install -r requirements.txt
```

## Start the API server

```powershell
py -m uvicorn main:app --reload
```

Open these addresses in your browser:
- API home: http://127.0.0.1:8000/
- Interactive API documentation: http://127.0.0.1:8000/docs
- Health check: http://127.0.0.1:8000/health

Keep the terminal running while using the API docs. Press Ctrl+C to stop.

## Endpoints
- `GET /` — API information
- `GET /health` — health check
- `POST /simulate` — multi-pond dissolved-oxygen risk simulation
- `POST /optimize` — generator allocation plan
- `GET /demo-scenarios` — list the three fixed, simulated judge-demo scenarios
- `POST /demo-scenarios/{scenario_id}/run` — run one scenario and return its shared inputs, risk simulation, allocation comparison, and decision explanation together. Valid IDs: `normal`, `moderate`, `critical`.

Demo scenario responses are deterministic for the same application version and
fixed inputs. Each response labels its simulation as simulated, includes
user-planning inputs separately, and indicates that actual sensor readings are
not supported.

## Demo request for POST /simulate

```json
{
  "outage_hours": 6,
  "time_step_minutes": 5,
  "alert_threshold_mg_l": 4.0,
  "critical_threshold_mg_l": 3.0,
  "ponds": [
    {
      "pond_id": "P1",
      "area_m2": 5000,
      "average_depth_m": 1.2,
      "initial_do_mg_l": 5.2,
      "biomass_kg": 1200
    },
    {
      "pond_id": "P2",
      "area_m2": 6500,
      "average_depth_m": 1.3,
      "initial_do_mg_l": 6.0,
      "biomass_kg": 900
    }
  ]
}
```

For `POST /simulate`, both oxygen thresholds must be positive and the critical
threshold must be lower than the alert threshold. Invalid threshold ordering is
rejected with HTTP 422.

## Important
This API serves simulated outputs using illustrative, unvalidated parameters.
It is not connected to live sensors and must not be used for real farm operating
decisions. Field use requires aquaculture expert review, local calibration and
independent validation.
