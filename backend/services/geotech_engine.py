import math
import json
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
SLOPES_FILE = DATA_DIR / "terrain_slopes.json"

def calculate_ari_14d(past_14d_daily_rain: list, decay_k: float = 0.84) -> float:
    """
    Computes the 14-day Antecedent Rainfall Index (ARI):
    ARI = Sum(k^i * R_i) for i from 1 to 14
    Captures cumulative pore-water pressure buildup over 14 days.
    """
    if not past_14d_daily_rain:
        return 0.0
    
    ari = 0.0
    # Process from yesterday (i=1) back to 14 days ago (i=14)
    rev_daily = list(reversed(past_14d_daily_rain))[:14]
    for i, rain_mm in enumerate(rev_daily, start=1):
        weight = math.pow(decay_k, i)
        ari += weight * rain_mm
        
    return round(ari, 2)

def calculate_factor_of_safety(
    slope_gradient_deg: float,
    soil_cohesion_kpa: float,
    friction_angle_deg: float,
    soil_depth_m: float,
    rainfall_24h_mm: float,
    ari_mm: float,
    unit_weight_kn_m3: float = 19.5
) -> float:
    """
    Computes the geotechnical Infinite Slope Factor of Safety (FoS):
    FoS = [ c' + (gamma * z * cos^2(beta) - u) * tan(phi) ] / [ gamma * z * sin(beta) * cos(beta) ]
    
    u = Pore-water pressure (kPa), derived from saturated soil column.
    FoS < 1.0 indicates physical slope failure condition.
    """
    beta_rad = math.radians(slope_gradient_deg)
    phi_rad = math.radians(friction_angle_deg)
    
    cos_beta = math.cos(beta_rad)
    sin_beta = math.sin(beta_rad)
    
    # Saturated water table height m_w (0.0 to 1.0) based on rainfall + ARI
    # Saturation threshold for typical Himalayan colluvium: 150mm combined
    combined_saturation = rainfall_24h_mm + (0.35 * ari_mm)
    saturation_ratio = min(1.0, max(0.05, combined_saturation / 160.0))
    
    # Pore pressure u = gamma_w * z * saturation_ratio * cos^2(beta)
    gamma_w = 9.81  # Water unit weight kN/m3
    pore_pressure_u = gamma_w * soil_depth_m * saturation_ratio * (cos_beta ** 2)
    
    # Normal effective stress
    total_normal_stress = unit_weight_kn_m3 * soil_depth_m * (cos_beta ** 2)
    effective_normal_stress = max(1.0, total_normal_stress - pore_pressure_u)
    
    # Resisting shear strength (Mohr-Coulomb)
    shear_strength = soil_cohesion_kpa + (effective_normal_stress * math.tan(phi_rad))
    
    # Driving shear stress
    driving_stress = unit_weight_kn_m3 * soil_depth_m * sin_beta * cos_beta
    if driving_stress <= 0.1:
        return 3.0
        
    fos = shear_strength / driving_stress
    return round(max(0.2, min(4.0, fos)), 2)

def assess_slope_risk(slope_data: dict, rainfall_24h_mm: float, past_14d_daily_rain: list) -> dict:
    """
    Evaluates comprehensive slope risk by combining:
    1. Antecedent Rainfall Index (ARI)
    2. Infinite Slope Factor of Safety (FoS)
    3. InSAR satellite deformation creep
    """
    ari = calculate_ari_14d(past_14d_daily_rain)
    
    slope_deg = slope_data["slope_gradient_deg"]
    cohesion = slope_data["soil_cohesion_kpa"]
    friction = slope_data["friction_angle_deg"]
    depth = slope_data["soil_depth_m"]
    insar_creep = slope_data.get("insar_baseline_creep_mm_yr", 5.0)
    
    fos = calculate_factor_of_safety(
        slope_gradient_deg=slope_deg,
        soil_cohesion_kpa=cohesion,
        friction_angle_deg=friction,
        soil_depth_m=depth,
        rainfall_24h_mm=rainfall_24h_mm,
        ari_mm=ari
    )
    
    # Probability calibration based on FoS and InSAR creep
    # FoS <= 1.0 -> Prob >= 0.75 (Critical)
    # InSAR creep > 15mm/yr accelerates probability by +0.10
    base_prob = 1.0 / (1.0 + math.exp(3.0 * (fos - 1.15)))
    creep_factor = min(0.15, (insar_creep / 100.0))
    probability = round(min(0.99, max(0.02, base_prob + creep_factor)), 2)
    
    # NDMA Standard Hazard Categorization
    if probability < 0.25:
        category = "GREEN"
        threat_level = "Normal / Low Risk"
        action = "Regular highway monitoring. Safe for travel."
    elif probability < 0.55:
        category = "YELLOW"
        threat_level = "Advisory / Moderate Risk"
        action = "Pre-monsoon soil saturation rising. Maintenance teams alerted."
    elif probability < 0.75:
        category = "ORANGE"
        threat_level = "Watch / High Risk"
        action = "Critical threshold near. Restrict heavy convoy movement."
    else:
        category = "RED"
        threat_level = "Warning / Imminent Hazard"
        action = "Evacuate road corridor. Reroute traffic via alternate ridge bypass."
        
    return {
        "slope_id": slope_data["id"],
        "slope_name": slope_data["name"],
        "corridor_km": slope_data["corridor_km"],
        "center": slope_data["center"],
        "polygon": slope_data["polygon"],
        "dem_elevation_m": slope_data["dem_elevation_m"],
        "slope_gradient_deg": slope_deg,
        "rainfall_24h_mm": round(rainfall_24h_mm, 1),
        "ari_14d_mm": ari,
        "factor_of_safety": fos,
        "insar_creep_mm_yr": insar_creep,
        "landslide_probability": probability,
        "category": category,
        "threat_level": threat_level,
        "recommended_action": action
    }

def evaluate_all_corridor_slopes(simulated_rainfall_mm: float, past_14d_daily_rain: list = None) -> list:
    """
    Evaluates all known slopes along the NH-10 corridor given a current or simulated rainfall.
    """
    with open(SLOPES_FILE, "r", encoding="utf-8-sig") as f:
        slopes = json.load(f)
        
    if past_14d_daily_rain is None:
        past_14d_daily_rain = [8.0, 12.0, 18.0, 22.0, 14.0, 10.0, 32.0, 45.0, 52.0, 38.0, 60.0, 75.0, 80.0, 88.0]
        
    results = []
    for slope in slopes:
        risk_profile = assess_slope_risk(slope, simulated_rainfall_mm, past_14d_daily_rain)
        results.append(risk_profile)
        
    return results

if __name__ == "__main__":
    print("Testing Geotechnical AI Engine:")
    print("--- Baseline Dry Rain (15mm) ---")
    dry_results = evaluate_all_corridor_slopes(15.0)
    for r in dry_results[:2]:
        print(f"[{r['category']}] {r['slope_name']}: FoS={r['factor_of_safety']}, Prob={r['landslide_probability']}")
        
    print("\n--- Extreme Cloudburst (140mm) ---")
    wet_results = evaluate_all_corridor_slopes(140.0)
    for r in wet_results[:2]:
        print(f"[{r['category']}] {r['slope_name']}: FoS={r['factor_of_safety']}, Prob={r['landslide_probability']}")
