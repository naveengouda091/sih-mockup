# GeoRakshak-NER: Geotechnical & Spatial Architecture
> *Developed for Smart India Hackathon (SIH) 2026 — Problem Statement 25022 (PS-01)*

## 1. Study Area Coordinates
- **Corridor:** NH-10 (Sevoke to Gangtok Lifeline)
- **Bounding Box:** Lat `26.85°N` to `27.35°N`, Lon `88.40°E` to `88.65°E`
- **Documented Hotspots:**
  - 29th Mile (Teesta Bazaar): `27.0667°N, 88.4333°E`
  - Likhu Bhir: `27.1333°N, 88.4833°E`
  - Seti Jhora: `26.9333°N, 88.4333°E`

## 2. Geotechnical Math Formulations

### Antecedent Rainfall Index (ARI)
$$\text{ARI}_t = \sum_{i=1}^{14} k^i \cdot R_{t-i}$$
- $k = 0.84$ (calibrated soil drainage coefficient for Eastern Himalayan colluvium).
- $R_{t-i}$ = Historical rainfall $i$ days prior.

### Infinite Slope Factor of Safety (FoS)
$$\text{FoS} = \frac{c' + (\gamma \cdot z \cdot \cos^2\beta - u) \cdot \tan\phi'}{\gamma \cdot z \cdot \sin\beta \cdot \cos\beta}$$
- $\beta$ = Slope angle from 30m NASA DEM.
- $u$ = Dynamic pore-water pressure ($kPa$) driven by rain + ARI.
- $\text{FoS} < 1.0$ indicates limit equilibrium failure condition.

## 3. Graceful Degradation Fallback Matrix
1. **Radar InSAR Decorrelation:** Fallback to GSI Empirical Threshold: $I = 14.82 \cdot D^{-0.39}$.
2. **Weather API Outage:** Automatic transition to local 48-hour numerical model cache.
3. **Cellular Network Failure:** Standardized ITU-T X.1303 CAP XML payloads over priority SMS cell-broadcast and sirens.
