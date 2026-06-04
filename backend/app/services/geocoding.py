"""Geocoding helpers using OpenStreetMap Nominatim (free, no API key)."""
import re
import httpx

NOMINATIM_SEARCH = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "VagariVita/0.1 (https://github.com/TTHollis/vagari-vita)"


ZIPPOPOTAM_URL = "https://api.zippopotam.us"


async def _try_zippopotam(zip_code: str) -> dict | None:
    """
    Purpose-built free zip lookup service. Much more reliable than Nominatim
    for US zips and not subject to the same aggressive rate limits.
    """
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            resp = await client.get(f"{ZIPPOPOTAM_URL}/us/{zip_code}")
            if resp.status_code != 200:
                return None
            data = resp.json()
    except Exception:
        return None

    places = data.get("places", [])
    if not places:
        return None
    place = places[0]
    city = (place.get("place name") or "").strip()
    state_abbr = (place.get("state abbreviation") or "").strip().upper()
    if not city:
        return None
    return {"city": city, "state": state_abbr, "country": "US"}


async def _try_nominatim(zip_code: str, country: str = "us") -> dict | None:
    """Nominatim fallback for international zips or when zippopotam fails."""
    params = {
        "postalcode": zip_code,
        "country": country,
        "format": "jsonv2",
        "addressdetails": 1,
        "limit": 1,
    }
    headers = {"User-Agent": USER_AGENT, "Accept-Language": "en"}

    try:
        async with httpx.AsyncClient(timeout=8, headers=headers) as client:
            resp = await client.get(NOMINATIM_SEARCH, params=params)
            if resp.status_code != 200:
                return None
            data = resp.json()
            if not data:
                params.pop("country", None)
                resp = await client.get(NOMINATIM_SEARCH, params=params)
                if resp.status_code != 200:
                    return None
                data = resp.json()
                if not data:
                    return None
    except Exception:
        return None

    addr = data[0].get("address", {}) if data else {}
    city = (
        addr.get("city")
        or addr.get("town")
        or addr.get("village")
        or addr.get("hamlet")
        or addr.get("municipality")
        or addr.get("county")
    )
    iso = addr.get("ISO3166-2-lvl4", "")
    state_code = ""
    if iso and "-" in iso:
        parts = iso.split("-")
        if len(parts) > 1 and len(parts[1]) <= 3:
            state_code = parts[1]
    if not state_code:
        state_code = addr.get("state", "") or ""
    country_code = (addr.get("country_code") or "").upper()
    if not city:
        return None
    return {"city": city, "state": state_code, "country": country_code}


async def zip_to_location(zip_code: str, country: str = "us") -> dict | None:
    """
    Look up a postal code → {city, state, country}.
    Tries zippopotam.us first (purpose-built, reliable for US), falls back
    to Nominatim for international zips or if zippopotam fails.
    """
    # Try zippopotam first — designed for this exact lookup, far more reliable
    if country.lower() == "us":
        result = await _try_zippopotam(zip_code)
        if result:
            return result
    # Fallback to Nominatim
    return await _try_nominatim(zip_code, country)


_ZIP_PATTERN = re.compile(r"^\d{5}$")

# Full-name → 2-letter code lookup so "Florida" and "FL" canonicalize the same
US_STATES = {
    "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR",
    "california": "CA", "colorado": "CO", "connecticut": "CT", "delaware": "DE",
    "florida": "FL", "georgia": "GA", "hawaii": "HI", "idaho": "ID",
    "illinois": "IL", "indiana": "IN", "iowa": "IA", "kansas": "KS",
    "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD",
    "massachusetts": "MA", "michigan": "MI", "minnesota": "MN",
    "mississippi": "MS", "missouri": "MO", "montana": "MT", "nebraska": "NE",
    "nevada": "NV", "new hampshire": "NH", "new jersey": "NJ",
    "new mexico": "NM", "new york": "NY", "north carolina": "NC",
    "north dakota": "ND", "ohio": "OH", "oklahoma": "OK", "oregon": "OR",
    "pennsylvania": "PA", "rhode island": "RI", "south carolina": "SC",
    "south dakota": "SD", "tennessee": "TN", "texas": "TX", "utah": "UT",
    "vermont": "VT", "virginia": "VA", "washington": "WA",
    "west virginia": "WV", "wisconsin": "WI", "wyoming": "WY",
    "district of columbia": "DC", "washington dc": "DC", "washington d.c.": "DC",
}


def _normalize_state(state: str) -> str:
    """Convert any US state input ('Florida', 'florida', 'FL', 'fl') to 'FL'."""
    s = state.strip()
    if not s:
        return s
    # Already a 2-letter abbreviation
    if len(s) == 2:
        return s.upper()
    # Full name lookup
    return US_STATES.get(s.lower(), s.title())


async def canonicalize_location(label: str) -> str:
    """
    Normalize a location label so the same place produces the same key
    regardless of how the user typed it.

    Examples:
      - "32099"                  -> "Jacksonville, FL"
      - "Jacksonville, FL"       -> "Jacksonville, FL"
      - "Jacksonville, Florida"  -> "Jacksonville, FL"
      - "jacksonville, fl"       -> "Jacksonville, FL"
      - "Jacksonville, FL (32099)" -> "Jacksonville, FL"
      - "Tokyo"                  -> "Tokyo"

    Falls back to title-cased input if normalization can't be performed.
    """
    cleaned = (label or "").strip()
    if not cleaned:
        return cleaned

    # Strip any "(12345)" zip suffix the events router may have added
    cleaned = re.sub(r"\s*\(\d{5}\)\s*$", "", cleaned)

    # 5-digit numeric → US zip → expand to city, state
    if _ZIP_PATTERN.match(cleaned):
        location = await zip_to_location(cleaned)
        if location and location.get("city"):
            state = _normalize_state(location.get("state") or "")
            city = location["city"].strip().title()
            return f"{city}, {state}" if state else city
        return cleaned

    # "City, State" format → normalize both parts
    if "," in cleaned:
        parts = [p.strip() for p in cleaned.split(",", 1)]
        if len(parts) == 2 and parts[0] and parts[1]:
            city = parts[0].title()
            state = _normalize_state(parts[1])
            return f"{city}, {state}"

    # Single-name international city → just title case it
    return cleaned.title()
