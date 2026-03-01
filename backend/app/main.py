from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db import engine
from app import models
from app.routers import restaurants, analyze, validate, places


startup_errors = []

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables
    models.Base.metadata.create_all(bind=engine)
    # Generate OSM data file and load restaurants
    try:
        import importlib, os
        osm_json = os.path.join(os.path.dirname(__file__), "osm_nashville.json")
        if not os.path.exists(osm_json):
            gen = importlib.import_module("app.generate_osm_data")
        from app.osm_loader import load as osm_load
        osm_load()
    except Exception as e:
        import traceback
        err = traceback.format_exc()
        print(f"OSM load warning: {err}")
        startup_errors.append(f"OSM: {err}")
    # Also run the original seed for meta data / reviews
    try:
        from app.seed import run_seed
        run_seed()
    except Exception as e:
        import traceback
        err = traceback.format_exc()
        print(f"Seed warning: {err}")
        startup_errors.append(f"Seed: {err}")
    yield


app = FastAPI(
    title="Tourist Targeting Score API",
    description="AI-powered restaurant intelligence system",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(restaurants.router, prefix="/api", tags=["restaurants"])
app.include_router(analyze.router, prefix="/api", tags=["analysis"])
app.include_router(validate.router, prefix="/api", tags=["validation"])
app.include_router(places.router, prefix="/api", tags=["places"])


@app.get("/api/startup-log")
def startup_log():
    return {"errors": startup_errors}
