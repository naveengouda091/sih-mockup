from fastapi import FastAPI, Query, Body, Response
from fastapi.middleware.cors import CORSMiddleware
import json
from pathlib import Path

from services.weather_service import fetch_weather, fetch_sikkim_weather, REGIONAL_COORDINATES
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
    version="2.0.0"
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
        "version": "2.0.0 (Pan-NER & National Coverage)",
        "competition": "Smart India Hackathon 2026",
        "problem_statement": "PS-01: AI-Based Landslide Early Warning in NER",
        "endpoints": {
            "regions": "/api/regions",
            "weather": "/api/weather/live?region=all",
            "corridor": "/api/corridor",
            "hotspots": "/api/hotspots?region=ALL",
            "slopes_live": "/api/slopes/current",
            "simulation": "/api/simulate-cloudburst?rainfall_mm=120",
            "evacuation_routing": "/api/routing/evacuate",
            "cap_xml": "/api/alerts/cap",
            "multilingual_alerts": "/api/alerts/multilingual",
            "citizen_reports": "/api/citizen/reports"
        }
    }

@app.get("/api/regions")
def get_supported_regions():
    with open(HOTSPOTS_FILE, "r", encoding="utf-8-sig") as f:
        all_hotspots = json.load(f)

    regions_meta = [
        {
            "id": "all",
            "name": "🌐 All NER & Pan-India Hotspots",
            "corridor": "All Critical Lifeline Corridors",
            "center": [26.20, 92.20],
            "zoom": 7,
            "hotspots_count": len(all_hotspots)
        },
        {
            "id": "sikkim",
            "name": "🏔️ Sikkim NH-10 (AH 10) Corridor",
            "corridor": "Sevoke - Gangtok (NH-10 / AH 10)",
            "center": [27.12, 88.52],
            "zoom": 11,
            "hotspots_count": len([h for h in all_hotspots if h.get("region") == "sikkim"])
        },
        {
            "id": "nagaland",
            "name": "🚗 Nagaland NH-29 Lifeline",
            "corridor": "Dimapur - Kohima Corridor (NH-29)",
            "center": [25.75, 93.95],
            "zoom": 10,
            "hotspots_count": len([h for h in all_hotspots if h.get("region") == "nagaland"])
        },
        {
            "id": "meghalaya",
            "name": "🌧️ Meghalaya NH-6 Lifeline",
            "corridor": "Shillong - Silchar (NH-6)",
            "center": [25.35, 92.30],
            "zoom": 9,
            "hotspots_count": len([h for h in all_hotspots if h.get("region") == "meghalaya"])
        },
        {
            "id": "manipur",
            "name": "⛰️ Manipur NH-2 / NH-37 Corridors",
            "corridor": "Imphal Lifelines (NH-2 & NH-37)",
            "center": [24.85, 93.70],
            "zoom": 10,
            "hotspots_count": len([h for h in all_hotspots if h.get("region") == "manipur"])
        },
        {
            "id": "assam",
            "name": "🚂 Assam Barail Range & Dima Hasao",
            "corridor": "Haflong - Jatinga Hill Artery",
            "center": [25.18, 93.03],
            "zoom": 10,
            "hotspots_count": len([h for h in all_hotspots if h.get("region") == "assam"])
        },
        {
            "id": "arunachal",
            "name": "🌲 Arunachal Pradesh NH-13",
            "corridor": "Trans-Arunachal & Tawang Strategic",
            "center": [27.50, 92.80],
            "zoom": 8,
            "hotspots_count": len([h for h in all_hotspots if h.get("region") == "arunachal"])
        },
        {
            "id": "mizoram",
            "name": "🏘️ Mizoram NH-54 (Aizawl Lifeline)",
            "corridor": "Aizawl - Lunglei Corridor",
            "center": [23.73, 92.71],
            "zoom": 11,
            "hotspots_count": len([h for h in all_hotspots if h.get("region") == "mizoram"])
        },
        {
            "id": "national",
            "name": "🇮🇳 National High-Risk Zones",
            "corridor": "Uttarakhand, Himachal & Western Ghats",
            "center": [28.50, 78.50],
            "zoom": 6,
            "hotspots_count": len([h for h in all_hotspots if h.get("region") == "national"])
        }
    ]
    return regions_meta

@app.get("/api/corridor")
def get_corridor_vectors():
    with open(CORRIDOR_FILE, "r", encoding="utf-8-sig") as f:
        return json.load(f)

@app.get("/api/hotspots")
def get_gsi_hotspots(region: str = Query(default="ALL", description="Filter by region (e.g. ALL, sikkim, nagaland)")):
    with open(HOTSPOTS_FILE, "r", encoding="utf-8-sig") as f:
        hotspots = json.load(f)
    if region and region.upper() != "ALL":
        hotspots = [h for h in hotspots if h.get("region", "").lower() == region.lower()]
    return hotspots

@app.get("/api/weather/live")
def get_live_weather(
    lat: float = Query(default=None),
    lon: float = Query(default=None),
    region: str = Query(default=None)
):
    if region and region.lower() in REGIONAL_COORDINATES:
        reg_info = REGIONAL_COORDINATES[region.lower()]
        return fetch_weather(lat=reg_info["lat"], lon=reg_info["lon"], location_name=reg_info["name"])
    
    target_lat = lat if lat is not None else 27.33
    target_lon = lon if lon is not None else 88.61
    loc_name = f"Coordinates ({target_lat:.2f}, {target_lon:.2f})"
    return fetch_weather(lat=target_lat, lon=target_lon, location_name=loc_name)

@app.get("/api/slopes/current")
def get_current_slope_hazard(lat: float = 27.33, lon: float = 88.61):
    weather = fetch_weather(lat=lat, lon=lon)
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
    rainfall_mm: float = Query(default=120.0, ge=0.0, le=300.0, description="Simulated 24-hour rainfall in mm"),
    lat: float = Query(default=27.33),
    lon: float = Query(default=88.61)
):
    """
    Stress-tests the corridor by recalculating slope geotechnical stability
    and dynamic Factor of Safety (FoS) under simulated rainfall conditions.
    """
    weather = fetch_weather(lat=lat, lon=lon)
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
        weather = fetch_weather()
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
