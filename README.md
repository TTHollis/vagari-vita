# Vagari Vita 🌍

> **Wander Life. Wander Culture.**

**Live app:** [vagarivita.onrender.com](https://vagarivita.onrender.com)

A React PWA that helps you discover what's happening in any city — whether you live there or you're just passing through.

---

## What It Does

Vagari Vita has two modes designed around two different mindsets.

### 📍 Local Mode
You're a resident of this city.
- Live event listings (concerts, sports, festivals, comedy, arts) sourced from Ticketmaster + Eventbrite
- Filter by category and date — "this weekend," "next 7 days," or a custom range
- View events three ways: grid, calendar month view (today circled), or an interactive map
- Save events to your phone for later
- Add events to your calendar (Apple Calendar, Outlook, Google)
- **Share local knowledge** — contribute insider tips that travelers heading to your city will see, and mark the most useful ones as helpful

### ✈️ Nomad Mode
You're visiting somewhere new.
- An AI-generated **Local Guide** for any city on Earth — vibe, etiquette, neighborhoods, food, transport
- The same live event listings (grid, calendar, or map), so you know what's happening during your trip
- **Read insider tips** posted by locals — the bus routes, the dive bars, the food trucks, the etiquette traps to avoid
- Feeling spontaneous? Hit **Surprise me** to explore a random city

---

## Built For Mobile

Vagari Vita is a Progressive Web App — you can install it directly to your phone's home screen from the browser. No app store required. Works fully offline for browsing previously cached content.

Native sharing, geolocation auto-detect, and the Add to Calendar export all work like a real native app once installed.

---

## Privacy & Ethics

Vagari Vita is built with privacy in mind:
- **No accounts, no logins, no tracking**
- Saved events and search history live only in your browser
- Community tips are AI-moderated to keep the space free of hate, harassment, and harmful content
- Anyone can report a tip that slips through, and reported content is automatically hidden pending review

Read our full ethics statement: **[ETHICS.md](./ETHICS.md)**

---

## Tech, at a glance

- React PWA (frontend) + FastAPI (backend) + SQLite (community tips)
- AI: OpenAI GPT-4 for guides, OpenAI Moderation API for content screening
- Events: Ticketmaster Discovery API + Eventbrite API
- Geocoding: OpenStreetMap Nominatim
- Deployed on Render.com

---

## Feedback & Contact

Found a bug? Have an idea? Something feel off?

- **Email:** [Timothy.Troy.Hollis@gmail.com](mailto:Timothy.Troy.Hollis@gmail.com)
- **In-app feedback form** at the bottom of every page
- **GitHub issues:** [github.com/TTHollis/urban-nomad/issues](https://github.com/TTHollis/urban-nomad/issues)

---

## License

© 2026 Timothy Troy Hollis. All rights reserved.

The source is public for transparency — so the ethics and content-moderation practices can be verified — not as a template to clone or redistribute. Please don't repackage it as your own.

Interested in using part of this work? Reach out: [Timothy.Troy.Hollis@gmail.com](mailto:Timothy.Troy.Hollis@gmail.com)
