# NightSky.earth for Claude

![NightSky.earth logo](assets/logo.png)

NightSky helps you plan stargazing, sky-event, and astrophotography sessions for named places. Its five skills guide Claude through place selection, source-linked astronomy and weather evidence, practical preparation, and clear handling of missing data. The plugin connects to NightSky's public, read-only MCP service at `https://mcp.nightsky.earth/mcp?presentation=text`; it does not contain API keys or a local server. This Claude presentation returns complete text results without the planning card and excludes OpenWeather values that require the card's linked logo.

Start by asking, “Plan a beginner stargazing night in Cape Town this Friday.” You can then ask for nearby observing candidates, target directions at a specific time, or preparation steps. NightSky's calculations and forecasts do not verify site access, safety, or clear skies. Provider credits and valid times belong beside the data they support.

The service processes the place and planning details you send through Claude. A named place may itself be personal information. NightSky does not keep prompts or submitted locations in a persistent user profile or request history, but technical route/outcome logs and aggregate provider quota records have separate retention limits. To answer some requests, its server sends relevant places, coordinates, dates or catalogue searches to the active independent providers described on the [Sources page](https://nightsky.earth/sources/). Skills may also suggest optional Claude search or browsing of official event and site-access pages; those host services process the query separately from the declared NightSky connector.

Read the [privacy policy](https://nightsky.earth/privacy/), [terms](https://nightsky.earth/terms/), and [getting started guide](https://nightsky.earth/get-started/). For help, use [NightSky contact](https://nightsky.earth/contact/). This Claude plugin is intended for adults aged 18 or older, in line with Claude's account requirements; NightSky's general website has its own audience statement.

The MCP connector and this skill bundle use the same production URL. Installing both should expose one NightSky tool set.
