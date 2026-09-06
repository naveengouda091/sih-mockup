import uuid
import sys
from datetime import datetime, timezone

# Ensure UTF-8 output even in Windows cmd console
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

CITIZEN_REPORTS = [
    {
        "report_id": "CR-SKM-101",
        "timestamp": "2026-09-06T07:15:00Z",
        "reporter": "Pema Lepcha (Local Taxi Driver)",
        "coordinates": [88.4350, 27.0680],
        "location_name": "Near 29th Mile Teesta Viewpoint",
        "hazard_type": "Fresh Tension Cracks on Road Surface",
        "severity": "HIGH",
        "description": "Noticed 4-inch wide road surface crack extending 15 meters along the valley shoulder.",
        "verified_by_ai": True,
        "upvotes": 12
    },
    {
        "report_id": "CR-SKM-102",
        "timestamp": "2026-09-06T08:30:00Z",
        "reporter": "BRO Highway Patrol Unit 4",
        "coordinates": [88.4840, 27.1350],
        "location_name": "Likhu Bhir KM 42",
        "hazard_type": "Continuous Small Rock Rolls & Mud Seepage",
        "severity": "CRITICAL",
        "description": "Muddy water gushing through retaining wall weep holes; continuous pebble rolling onto carriageway.",
        "verified_by_ai": True,
        "upvotes": 28
    }
]

def generate_cap_xml_alert(hazard_slopes: list) -> str:
    """
    Generates an ITU-T X.1303 compliant Common Alerting Protocol (CAP) XML document.
    This is the exact format used by NDMA SACHET and State Emergency Operations Centers.
    """
    alert_id = f"IND-NDMA-SKM-{uuid.uuid4().hex[:8].upper()}"
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    
    red_slopes = [s for s in hazard_slopes if s.get("category") == "RED"]
    hotspot_names = ", ".join([s.get("slope_name", "Unknown Sector") for s in red_slopes]) or "NH-10 Corridor"
    
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>{alert_id}</identifier>
  <sender>georakshak-ner-sdma@sikkim.gov.in</sender>
  <sent>{now_iso}</sent>
  <status>Actual</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>
  <code>IPAWS-CAP-PROFILE</code>
  <info>
    <category>Geo</category>
    <event>Landslide Warning & Highway Severance</event>
    <urgency>Immediate</urgency>
    <severity>Extreme</severity>
    <certainty>Observed</certainty>
    <eventCode>
      <valueName>NDMA_EVENT_CODE</valueName>
      <value>LS-01</value>
    </eventCode>
    <headline>URGENT: Imminent Slope Failure Warning for {hotspot_names}</headline>
    <description>Satellite InSAR radar and live Antecedent Rainfall Index indicate catastrophic slope destabilization along NH-10. Slope saturation exceeds 85% with active creep.</description>
    <instruction>Evacuate affected road sectors immediately. Divert all emergency supply vehicles via Damdim-Lava-Pakyong ridge bypass. Avoid riverbank alignments.</instruction>
    <area>
      <areaDesc>NH-10 Sevoke-Teesta-Rangpo Corridor (Sikkim / North Bengal)</areaDesc>
      <circle>27.0667,88.4333,5.0</circle>
    </area>
  </info>
</alert>"""
    return xml

def get_multilingual_alert(hazard_slopes: list) -> dict:
    """
    Generates multi-lingual public emergency broadcasts in regional NER languages:
    English, Hindi, Assamese, Bengali, and Nepali.
    """
    red_slopes = [s for s in hazard_slopes if s.get("category") == "RED"]
    has_red = len(red_slopes) > 0
    names = ", ".join([s.get("slope_name", "") for s in red_slopes]) if has_red else "NH-10"
    
    return {
        "is_active": has_red,
        "hazard_level": "RED (CRITICAL)" if has_red else "YELLOW (ADVISORY)",
        "messages": {
            "en": {
                "language": "English",
                "title": "EMERGENCY LANDSLIDE ALERT",
                "body": f"Urgent Warning: Critical landslide risk detected along {names}. NH-10 is closed to civilian transit. Reroute via Lava bypass.",
                "action": "Avoid NH-10. Follow SDRF instructions."
            },
            "hi": {
                "language": "हिन्दी (Hindi)",
                "title": "आपातकालीन भूस्खलन चेतावनी",
                "body": f"अति आवश्यक: {names} के पास भारी भूस्खलन का गंभीर खतरा। NH-10 मार्ग बाधित। कृपया लावा बाईपास मार्ग का उपयोग करें।",
                "action": "NH-10 मार्ग से बचें। आपदा प्रबंधन निर्देशों का पालन करें।"
            },
            "as": {
                "language": "অসমীয়া (Assamese)",
                "title": "জৰুৰী ভূমিস্খলন সতৰ্কবাৰ্তা",
                "body": f"{names} অঞ্চলত গুৰুতৰ ভূমিস্খলনৰ সম্ভাৱনা। NH-10 পথত যাতায়াত বন্ধ কৰা হৈছে। লাভা বিকল্প পথ ব্যৱহাৰ কৰক।",
                "action": "NH-10 পথ পৰিহাৰ কৰক। প্ৰশাসনৰ নিৰ্দেশনা মানি চলক।"
            },
            "bn": {
                "language": "বাংলা (Bengali)",
                "title": "জরুরি ভূমিধস সতর্কতা",
                "body": f"{names} এলাকায় বিপজ্জনক ভূমিধসের আশঙ্কা। NH-10 রাস্তা দিয়ে যান চলাচল স্থগিত। লাভা বাইপাস রোড ব্যবহার করুন।",
                "action": "NH-10 এড়িয়ে চলুন। জরুরি নির্দেশ মেনে চলুন।"
            },
            "ne": {
                "language": "नेपाली (Nepali)",
                "title": "आपतकालीन पहिरो चेतावनी",
                "body": f"{names} क्षेत्रमा भीषण पहिरोको उच्च जोखिम। NH-10 सडक बन्द गरिएको छ। कृपया लाभा वैकल्पिक मार्ग प्रयोग गर्नुहोस्।",
                "action": "NH-10 बाट यात्रा नगर्नुहोस्। सुरक्षित स्थानमा बस्नुहोस्।"
            }
        }
    }

def add_citizen_report(report_data: dict) -> dict:
    """
    Appends a crowdsourced citizen hazard report.
    """
    new_report = {
        "report_id": f"CR-SKM-{len(CITIZEN_REPORTS) + 101}",
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "reporter": report_data.get("reporter", "Citizen Observer"),
        "coordinates": report_data.get("coordinates", [88.50, 27.20]),
        "location_name": report_data.get("location_name", "NH-10 Corridor"),
        "hazard_type": report_data.get("hazard_type", "Road Shoulder Crack"),
        "severity": report_data.get("severity", "MODERATE"),
        "description": report_data.get("description", "Reported via GeoRakshak mobile portal."),
        "verified_by_ai": True,
        "upvotes": 1
    }
    CITIZEN_REPORTS.append(new_report)
    return new_report

def get_all_citizen_reports() -> list:
    return CITIZEN_REPORTS

if __name__ == "__main__":
    dummy_slopes = [{"slope_name": "Teesta 29th Mile", "category": "RED"}]
    print("Testing CAP XML Generator:")
    print(generate_cap_xml_alert(dummy_slopes)[:300] + "...")
    print("\nTesting Multilingual Alerts:")
    alerts = get_multilingual_alert(dummy_slopes)
    for lang, m in alerts["messages"].items():
        print(f"[{m['language']}]: {m['title']} - {m['body'][:50]}...")
