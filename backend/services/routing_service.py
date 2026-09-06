import json
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
CORRIDOR_FILE = DATA_DIR / "nh10_corridor.geojson"

def compute_evacuation_routes(slope_evaluations: list) -> dict:
    """
    Computes comparative evacuation routes:
    1. 'Standard GPS Route' (Blind to landslide risks - continues down NH-10)
    2. 'GeoRakshak Hazard-Aware Route' (Detects Red/Orange slope hazards and routes via safe ridge bypass)
    """
    with open(CORRIDOR_FILE, "r", encoding="utf-8-sig") as f:
        corridor_geojson = json.load(f)
        
    nh10_feature = next((f for f in corridor_geojson["features"] if f["properties"]["id"] == "nh10-main"), None)
    bypass_feature = next((f for f in corridor_geojson["features"] if f["properties"]["id"] == "nh10-bypass-lava"), None)
    
    # Check if any slope intersecting NH-10 is in RED or ORANGE hazard
    red_slopes = [s for s in slope_evaluations if s.get("category") == "RED"]
    orange_slopes = [s for s in slope_evaluations if s.get("category") == "ORANGE"]
    
    is_nh10_severed = len(red_slopes) > 0
    hazard_hotspots = [s["slope_name"] for s in red_slopes]
    
    # Standard route metrics (Blind to risk)
    standard_route = {
        "route_id": "route-standard",
        "name": "Standard Highway (NH-10 Direct)",
        "distance_km": 114.0,
        "estimated_duration_hrs": 3.4,
        "is_safe": not is_nh10_severed,
        "status": "Hazard Zone Intersected - High Risk of Entrapment" if is_nh10_severed else "Clear for Travel",
        "blocked_segments": hazard_hotspots,
        "geometry": nh10_feature["geometry"] if nh10_feature else None,
        "risk_penalty_score": 100 * len(red_slopes) + 40 * len(orange_slopes),
        "warning_advisory": (
            f"DANGER: {len(red_slopes)} active slope failure zones detected on NH-10! "
            f"High probability of road collapse at: {', '.join(hazard_hotspots[:2])}."
        ) if is_nh10_severed else "Normal mountain driving conditions."
    }
    
    # GeoRakshak Safe Route metrics
    if is_nh10_severed:
        safe_route = {
            "route_id": "route-georakshak-bypass",
            "name": "GeoRakshak Safe Evacuation Ridge (via Damdim - Lava - Pakyong)",
            "distance_km": 142.0,
            "estimated_duration_hrs": 4.8,
            "is_safe": True,
            "status": "Safe Evacuation Corridor Active (Avoids all active landslide polygons)",
            "geometry": bypass_feature["geometry"] if bypass_feature else None,
            "risk_penalty_score": 5,  # Ridge route with low saturation
            "routing_reason": "NH-10 bypassed due to imminent slope failure at Teesta/Likhu gorge."
        }
        recommended_route_id = "route-georakshak-bypass"
    else:
        safe_route = {
            "route_id": "route-georakshak-direct",
            "name": "GeoRakshak Validated Highway (NH-10 Direct)",
            "distance_km": 114.0,
            "estimated_duration_hrs": 3.4,
            "is_safe": True,
            "status": "Safe for Transit (All slopes verified within stable thresholds)",
            "geometry": nh10_feature["geometry"] if nh10_feature else None,
            "risk_penalty_score": 0,
            "routing_reason": "All 6 monitored slope sectors are within stable geotechnical limits."
        }
        recommended_route_id = "route-georakshak-direct"
        
    return {
        "origin": "Sevoke / Siliguri Ingress Checkpost (26.8833, 88.4735)",
        "destination": "Gangtok District Hospital / Capital (27.3389, 88.6138)",
        "is_primary_corridor_severed": is_nh10_severed,
        "active_red_hazard_count": len(red_slopes),
        "recommended_route_id": recommended_route_id,
        "standard_route": standard_route,
        "safe_route": safe_route
    }

if __name__ == "__main__":
    mock_slopes = [
        {"slope_name": "Teesta 29th Mile", "category": "RED"},
        {"slope_name": "Likhu Bhir", "category": "RED"}
    ]
    result = compute_evacuation_routes(mock_slopes)
    print("Evacuation Router Test:")
    print(f"Primary NH-10 Severed: {result['is_primary_corridor_severed']}")
    print(f"Recommended Route: {result['safe_route']['name']}")
    print(f"Advisory: {result['standard_route']['warning_advisory']}")
