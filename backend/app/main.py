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

    # Auto-migration for place_id
    try:
        from app.db import SessionLocal
        from sqlalchemy import text
        db = SessionLocal()
        try:
            db.execute(text("SELECT place_id FROM restaurants LIMIT 1"))
        except Exception:
            db.rollback()
            try:
                db.execute(text("ALTER TABLE restaurants ADD COLUMN place_id VARCHAR(255);"))
                db.commit()
                db.execute(text("CREATE UNIQUE INDEX ix_restaurants_place_id ON restaurants (place_id);"))
                db.commit()
            except Exception as e_migration:
                print(f"Migration error: {e_migration}")
        finally:
            db.close()
    except Exception as e:
        print(f"Migration setup error: {e}")

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
    from app.db import SessionLocal
    db = SessionLocal()
    try:
        count = db.query(models.Restaurant).count()
        nashville_count = db.query(models.Restaurant).filter(models.Restaurant.city.ilike("%nashville%")).count()
    finally:
        db.close()
    import os
    return {
        "errors": startup_errors,
        "total_restaurants": count,
        "nashville_restaurants": nashville_count,
        "db_url": settings.database_url,
        "cwd": os.getcwd(),
    }
