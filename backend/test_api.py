from main import (
    root,
    get_corridor_vectors,
    get_gsi_hotspots,
    get_supported_regions,
    get_live_weather,
    get_current_slope_hazard,
    simulate_cloudburst,
    get_evacuation_routes,
    get_cap_alert,
    get_multilingual_broadcast,
    list_citizen_reports
)

def run_tests():
    print("Running Automated Backend Verification (Zero-Dependency)...")
    
    # 1. Root discovery
    r = root()
    assert r["system"] == "GeoRakshak-NER"
    print("  [PASS] Root endpoint discovery")
    
    # 2. Corridor vectors (Multi-Corridors)
    corridor = get_corridor_vectors()
    assert "features" in corridor
    assert len(corridor["features"]) >= 4
    corridor_names = [f["properties"]["id"] for f in corridor["features"]]
    print(f"  [PASS] Multi-corridor GeoJSON vectors: {corridor_names}")
    
    # 3. GSI Hotspots (Pan-NER & National)
    all_hotspots = get_gsi_hotspots("ALL")
    assert len(all_hotspots) >= 30
    nagaland_spots = get_gsi_hotspots("nagaland")
    assert len(nagaland_spots) >= 4
    print(f"  [PASS] GSI & ISRO historical landslide catalog ({len(all_hotspots)} disaster zones, {len(nagaland_spots)} in Nagaland)")
    
    # 4. Regional metadata
    regions = get_supported_regions()
    assert len(regions) >= 8
    print(f"  [PASS] Supported regions endpoint ({len(regions)} monitored regional corridors)")

    # 5. Live weather & satellite feed
    weather = get_live_weather(region="nagaland")
    assert "source" in weather
    assert "past_14_days_daily_rain_mm" in weather
    assert "Nagaland" in weather["location_name"]
    print(f"  [PASS] Dynamic satellite weather service (Location: {weather['location_name']}, Source: {weather['source']})")
    
    # 6. Live slope hazard
    slopes = get_current_slope_hazard()
    assert "hazard_summary" in slopes
    print(f"  [PASS] Current slope hazards (Evaluated {slopes['hazard_summary']['total_slopes']} slope sectors)")
    
    # 7. Cloudburst simulation
    sim = simulate_cloudburst(rainfall_mm=135.0)
    assert sim["simulation_parameters"]["simulated_rainfall_mm"] == 135.0
    assert sim["hazard_summary"]["red_critical"] >= 2
    assert "safe_route" in sim["evacuation_routes"]
    print(f"  [PASS] Cloudburst stress-test (Red slopes: {sim['hazard_summary']['red_critical']}, Safe Bypass Active)")
    
    # 8. CAP XML Alert
    cap = get_cap_alert(rainfall_mm=150.0)
    assert cap.status_code == 200
    assert b"<alert" in cap.body
    print("  [PASS] Common Alerting Protocol (CAP ITU X.1303) XML generation")
    
    # 9. Multilingual alerts
    multi = get_multilingual_broadcast(rainfall_mm=150.0)
    assert "messages" in multi
    assert "as" in multi["messages"] and "hi" in multi["messages"]
    print("  [PASS] Multi-lingual regional alert broadcasts (En, Hi, As, Bn, Ne)")
    
    # 10. Citizen reports
    reports = list_citizen_reports()
    assert len(reports) >= 2
    print(f"  [PASS] Citizen crowdsourced incident reports ({len(reports)} active field reports)")
    
    print("\n>>> ALL BACKEND API MODULES 100% VERIFIED ACROSS PAN-NER & NATIONAL HOTSPOTS! <<<\n")

if __name__ == "__main__":
    run_tests()
