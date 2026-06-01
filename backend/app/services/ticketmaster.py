import os
import httpx

BASE_URL = "https://app.ticketmaster.com/discovery/v2/events.json"


def _normalize(event: dict) -> dict:
    dates = event.get("dates", {}).get("start", {})
    venue = (event.get("_embedded", {}).get("venues") or [{}])[0]
    images = event.get("images", [])
    thumb = next((i["url"] for i in images if i.get("ratio") == "3_2"), None)

    loc = venue.get("location") or {}
    lat = loc.get("latitude")
    lng = loc.get("longitude")

    return {
        "id": f"tm-{event['id']}",
        "source": "ticketmaster",
        "name": event.get("name"),
        "start_date": dates.get("localDate"),
        "start_time": dates.get("localTime"),
        "venue_name": venue.get("name"),
        "venue_address": venue.get("address", {}).get("line1"),
        "city": venue.get("city", {}).get("name"),
        "state": venue.get("state", {}).get("stateCode"),
        "lat": float(lat) if lat else None,
        "lng": float(lng) if lng else None,
        "url": event.get("url"),
        "image": thumb,
        "category": (event.get("classifications") or [{}])[0]
            .get("segment", {})
            .get("name"),
    }


async def search_ticketmaster(
    *,
    city: str | None,
    state: str | None,
    zip_code: str | None,
    category: str | None,
    start_iso: str | None,
    end_iso: str | None,
    size: int,
) -> list[dict]:
    api_key = os.getenv("TICKETMASTER_API_KEY")
    if not api_key:
        return []

    params = {"apikey": api_key, "size": size, "sort": "date,asc"}

    if zip_code and not city:
        params["postalCode"] = zip_code
    elif city:
        params["city"] = city
        if state:
            s = state.strip()
            params["stateCode"] = s.upper()[:2] if len(s) <= 2 else s[:2].upper()

    if category:
        params["classificationName"] = category
    if start_iso:
        params["startDateTime"] = start_iso
    if end_iso:
        params["endDateTime"] = end_iso

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(BASE_URL, params=params)
        resp.raise_for_status()
        data = resp.json()

    raw = data.get("_embedded", {}).get("events", [])
    return [_normalize(e) for e in raw]
