import os
from typing import List, Optional
from urllib.parse import urlsplit

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, model_validator

from oxygen_model import Pond
from risk_engine import analyze_farm
from optimizer import optimize_allocation
from demo_scenarios import list_demo_scenarios, run_demo_scenario

DEFAULT_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


def parse_cors_origins(configured_origins: Optional[str]) -> List[str]:
    if configured_origins is None:
        return DEFAULT_CORS_ORIGINS.copy()

    origins = []
    for value in configured_origins.split(","):
        origin = value.strip().rstrip("/")
        if not origin:
            continue
        parsed = urlsplit(origin)
        try:
            parsed.port
        except ValueError as exc:
            raise ValueError(
                "CORS_ORIGINS entries must contain valid HTTP(S) origins"
            ) from exc
        if (
            origin == "*"
            or parsed.scheme not in {"http", "https"}
            or not parsed.netloc
            or not parsed.hostname
            or any(character.isspace() for character in parsed.netloc)
            or parsed.path
            or parsed.query
            or parsed.fragment
            or parsed.username
            or parsed.password
        ):
            raise ValueError(
                "CORS_ORIGINS must be a comma-separated list of HTTP(S) origins "
                "without paths, credentials, or wildcard entries"
            )
        if origin not in origins:
            origins.append(origin)
    return origins


app = FastAPI(
    title="AquaResQ API",
    description=(
        "Multi-Pond Aquaculture Emergency Intelligence API. "
        "All outputs are simulated demo estimates, not live farm measurements."
    ),
    version="0.4.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=parse_cors_origins(os.getenv("CORS_ORIGINS")),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PondInput(BaseModel):
    pond_id: str = Field(min_length=1, max_length=30)
    area_m2: float = Field(gt=0)
    average_depth_m: float = Field(gt=0)
    initial_do_mg_l: float = Field(gt=0)
    biomass_kg: float = Field(ge=0)
    water_column_demand_mg_l_h: float = Field(default=0.05, ge=0)
    sediment_demand_mg_l_h: float = Field(default=0.03, ge=0)
    shrimp_respiration_mg_kg_h: float = Field(default=0.20, ge=0)
    photosynthesis_mg_l_h: float = Field(default=0.0, ge=0)
    reaeration_per_h: float = Field(default=0.05, ge=0)
    saturation_do_mg_l: float = Field(default=7.0, gt=0)
    aeration_addition_mg_l_h: float = Field(default=0.0, ge=0)
    aerator_load_kw: float = Field(default=0.0, ge=0)


class SimulationRequest(BaseModel):
    ponds: List[PondInput] = Field(min_length=1)
    outage_hours: float = Field(default=6.0, gt=0, le=72)
    time_step_minutes: int = Field(default=5, ge=1, le=60)
    alert_threshold_mg_l: float = Field(default=4.0, gt=0)
    critical_threshold_mg_l: float = Field(default=3.0, gt=0)

    @model_validator(mode="after")
    def validate_threshold_order(self):
        if self.critical_threshold_mg_l >= self.alert_threshold_mg_l:
            raise ValueError("Require 0 < critical threshold < alert threshold")
        return self


class OptimizationRequest(BaseModel):
    ponds: List[PondInput] = Field(min_length=1)
    generator_capacity_kw: float = Field(ge=0)
    outage_hours: float = Field(default=6.0, gt=0, le=72)
    target_do_mg_l: float = Field(default=4.0, gt=0)
    time_step_minutes: int = Field(default=5, ge=1, le=60)
    available_energy_kwh: Optional[float] = Field(default=None, ge=0)


def to_ponds(items: List[PondInput]) -> List[Pond]:
    ponds = []
    for item in items:
        data = item.model_dump()
        ponds.append(Pond(**data))
    ids = [pond.pond_id for pond in ponds]
    if len(ids) != len(set(ids)):
        raise HTTPException(status_code=422, detail="pond_id values must be unique")
    return ponds


@app.get("/")
def root():
    return {
        "name": "AquaResQ API",
        "version": app.version,
        "status": "running",
        "notice": "Simulated demo API; not validated for real farm decisions.",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "healthy", "service": "aquaresq-api"}


@app.get("/demo-scenarios")
def demo_scenarios():
    return {"scenarios": list_demo_scenarios()}


@app.post("/demo-scenarios/{scenario_id}/run")
def run_demo(scenario_id: str):
    try:
        return run_demo_scenario(scenario_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Unknown demo scenario") from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/simulate")
def simulate(request: SimulationRequest):
    ponds = to_ponds(request.ponds)
    return analyze_farm(
        ponds,
        outage_hours=request.outage_hours,
        time_step_minutes=request.time_step_minutes,
        alert_threshold_mg_l=request.alert_threshold_mg_l,
        critical_threshold_mg_l=request.critical_threshold_mg_l,
    )


@app.post("/optimize")
def optimize(request: OptimizationRequest):
    ponds = to_ponds(request.ponds)
    try:
        return optimize_allocation(
            ponds,
            generator_capacity_kw=request.generator_capacity_kw,
            outage_hours=request.outage_hours,
            target_do_mg_l=request.target_do_mg_l,
            time_step_minutes=request.time_step_minutes,
            available_energy_kwh=request.available_energy_kwh,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
