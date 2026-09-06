# GeoRakshak-NER

> **AI-Powered Landslide Early Warning & Geo-Spatial Evacuation Intelligence for North Eastern Region (NER)**  
> *Developed for Smart India Hackathon (SIH) 2026 — Problem Statement 1*

---

## 🏔️ Overview

The North Eastern Region (NER) of India suffers recurring catastrophic landslides during monsoons, severing strategic lifeline highways (like NH-10 connecting Sikkim and NH-29 connecting Nagaland/Manipur).

**GeoRakshak-NER** is a **100% software, space-tech driven early warning platform** that operates with **zero ground hardware**. It fuses:
1. **Copernicus Sentinel-1 InSAR Satellite Radar:** Millimeter-scale surface displacement tracking through heavy monsoon cloud cover.
2. **NASA SRTM 30m Digital Elevation Models (DEM):** Topographic slope angle, aspect, and curvature calculation.
3. **Live Meteorological Feeds (Open-Meteo / IMD):** Real-time precipitation and 14-day rolling Antecedent Rainfall Index (ARI).
4. **Hazard-Aware A* Evacuation Routing:** Proactively redirects emergency convoys and citizens away from high-hazard corridors onto safe alternate mountain ridges.
5. **Common Alerting Protocol (CAP ITU X.1303):** Multi-lingual emergency notifications (Assamese, Hindi, Bengali, English).

---

## 🏛️ System Architecture

```
[Sentinel-1 InSAR Radar + NASA 30m DEM] + [Live Open-Meteo & IMD Precipitation API]
                                    │
                                    ▼
                    [Geotechnical AI Risk Engine]
         (14-Day ARI Saturation + Factor of Safety + XGBoost)
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
[3D Web GIS Command Center]                      [Hazard-Aware Evacuation & CAP]
 - Interactive NH-10 Corridor                     - Dynamic A* Safe Ridge Pathfinding
 - Cloudburst Stress-Test Slider                  - Multi-Lingual Citizen Broadcasts
 - Geotechnical Slope Deep-Dive                   - Graceful Degradation Fallbacks
```

---

## 🛡️ Fallback-Proof Design (Zero-BS)

- **Dense Forest Radar Decorrelation Fallback:** Falls back to GSI-calibrated empirical Intensity-Duration thresholds ($I = 14.82 \cdot D^{-0.39}$).
- **Weather API Outage Fallback:** Automatically switches to locally cached 48-hour numerical forecast.
- **Cellular Network Failure:** Standardized CAP XML payloads ready for low-bandwidth SMS cell-broadcast towers and disaster sirens.

---

## 📁 Repository Structure

```
SIH/
├── backend/                  # Python FastAPI Geotechnical & Spatial API
│   ├── data/                 # Real NH-10 GeoJSON & GSI Landslide Hotspots
│   ├── services/             # Weather, Geotech math, Routing & Alerts
│   └── main.py               # REST API endpoints
├── frontend/                 # React + Tailwind CSS + GIS Mapping UI
│   ├── src/                  # Components, interactive map, simulation controls
│   └── package.json
└── docs/                     # Geotechnical equations, SIH pitch notes
```

---

## 🚀 Quick Start

### Backend (Python FastAPI)
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
