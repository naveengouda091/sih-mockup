from fastapi import FastAPI, Query, Body, Response
from fastapi.middleware.cors import CORSMiddleware
import json
from pathlib import Path

from services.weather_service import fetch_sikkim_weather
from services.geotech_engine import evaluate_all_corridor_slopes
from services.routing_service import compute_evacuation_routes
from services.alert_service import (
    generate_cap_xml_alert,
    get_multilingual_alert,
    add_citizen_report,
    get_all_citizen_reports
)

DATA_DIR = Path(__file__).resolve().parent / "data"
CORRIDOR_FILE = DATA_DIR / "nh10_corridor.geojson"
HOTSPOTS_FILE = DATA_DIR / "gsi_landslide_hotspots.json"

app = FastAPI(
    title="GeoRakshak-NER Disaster Intelligence API",
    description="Zero-Hardware, Satellite & AI-Powered Landslide Early Warning and Evacuation System for NER",
    version="1.0.0"
)

# Enable CORS for frontend Vite development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "system": "GeoRakshak-NER",
        "status": "OPERATIONAL",
        "competition": "Smart India Hackathon 2026",
        "problem_statement": "PS-01: AI-Based Landslide Early Warning in NER",
        "endpoints": {
            "weather": "/api/weather/live",
            "corridor": "/api/corridor",
            "hotspots": "/api/hotspots",
            "slopes_live": "/api/slopes/current",
            "simulation": "/api/simulate-cloudburst?rainfall_mm=120",
            "evacuation_routing": "/api/routing/evacuate",
            "cap_xml": "/api/alerts/cap",
            "multilingual_alerts": "/api/alerts/multilingual",
            "citizen_reports": "/api/citizen/reports"
        }
    }

@app.get("/api/corridor")
def get_corridor_vectors():
    with open(CORRIDOR_FILE, "r", encoding="utf-8-sig") as f:
        return json.load(f)

@app.get("/api/hotspots")
def get_gsi_hotspots():
    with open(HOTSPOTS_FILE, "r", encoding="utf-8-sig") as f:
        return json.load(f)

@app.get("/api/weather/live")
def get_live_weather(lat: float = 27.33, lon: float = 88.61):
    return fetch_sikkim_weather(lat=lat, lon=lon)

@app.get("/api/slopes/current")
def get_current_slope_hazard():
    weather = fetch_sikkim_weather()
    rain_24h = weather["current"]["recent_24h_rainfall_mm"]
    past_14d = weather.get("past_14_days_daily_rain_mm", [])
    slopes = evaluate_all_corridor_slopes(rain_24h, past_14d)
    return {
        "weather_context": weather,
        "hazard_summary": {
            "total_slopes": len(slopes),
            "red_critical": len([s for s in slopes if s["category"] == "RED"]),
            "orange_watch": len([s for s in slopes if s["category"] == "ORANGE"]),
            "yellow_advisory": len([s for s in slopes if s["category"] == "YELLOW"]),
            "green_normal": len([s for s in slopes if s["category"] == "GREEN"])
        },
        "slopes": slopes
    }

@app.get("/api/simulate-cloudburst")
def simulate_cloudburst(
    rainfall_mm: float = Query(default=120.0, ge=0.0, le=300.0, description="Simulated 24-hour rainfall in mm")
):
    """
    Stress-tests the NH-10 corridor by recalculating slope geotechnical stability
    and dynamic Factor of Safety (FoS) under simulated rainfall conditions.
    """
    weather = fetch_sikkim_weather()
    past_14d = weather.get("past_14_days_daily_rain_mm", [])
    slopes = evaluate_all_corridor_slopes(rainfall_mm, past_14d)
    routes = compute_evacuation_routes(slopes)
    multilingual = get_multilingual_alert(slopes)
    
    return {
        "simulation_parameters": {
            "simulated_rainfall_mm": rainfall_mm,
            "soil_saturation_surge": f"{min(100, int((rainfall_mm / 140.0) * 100))}%"
        },
        "hazard_summary": {
            "total_slopes": len(slopes),
            "red_critical": len([s for s in slopes if s["category"] == "RED"]),
            "orange_watch": len([s for s in slopes if s["category"] == "ORANGE"]),
            "yellow_advisory": len([s for s in slopes if s["category"] == "YELLOW"]),
            "green_normal": len([s for s in slopes if s["category"] == "GREEN"])
        },
        "slopes": slopes,
        "evacuation_routes": routes,
        "multilingual_alert": multilingual
    }

@app.post("/api/routing/evacuate")
def get_evacuation_routes(slopes: list = Body(default=None)):
    if slopes is None:
        weather = fetch_sikkim_weather()
        slopes = evaluate_all_corridor_slopes(weather["current"]["recent_24h_rainfall_mm"])
    return compute_evacuation_routes(slopes)

@app.get("/api/alerts/cap", response_class=Response)
def get_cap_alert(rainfall_mm: float = 120.0):
    slopes = evaluate_all_corridor_slopes(rainfall_mm)
    cap_xml = generate_cap_xml_alert(slopes)
    return Response(content=cap_xml, media_type="application/xml")

@app.get("/api/alerts/multilingual")
def get_multilingual_broadcast(rainfall_mm: float = 120.0):
    slopes = evaluate_all_corridor_slopes(rainfall_mm)
    return get_multilingual_alert(slopes)

@app.get("/api/citizen/reports")
def list_citizen_reports():
    return get_all_citizen_reports()

@app.post("/api/citizen/reports")
def submit_citizen_report(report: dict = Body(...)):
    return add_citizen_report(report)
