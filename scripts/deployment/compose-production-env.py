#!/usr/bin/env python3
"""Add separately protected weather keys to a complete production env file.

The result is written only to stdout for the deployment pipeline. Never log it.
"""

import os
import re
import sys


def compose(base: str, weatherapi_key: str, openweather_key: str = "", openweather_admit: bool = False) -> str:
    if not base or "\r" in base or "\0" in base:
        raise ValueError("invalid base configuration")
    if not weatherapi_key:
        if openweather_admit:
            raise ValueError("OpenWeather requires the existing WeatherAPI composition")
        return base.rstrip("\n")
    if not re.fullmatch(r"[A-Za-z0-9]{16,128}", weatherapi_key):
        raise ValueError("invalid WeatherAPI credential format")
    if openweather_admit and (not openweather_key or not re.fullmatch(r"[A-Za-z0-9]{16,128}", openweather_key)):
        raise ValueError("invalid OpenWeather credential format")

    lines = base.rstrip("\n").split("\n")
    entries: dict[str, str] = {}
    positions: dict[str, int] = {}
    for index, line in enumerate(lines):
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            raise ValueError("invalid base configuration line")
        name, value = line.split("=", 1)
        if not re.fullmatch(r"[A-Z][A-Z0-9_]*", name) or name in entries:
            raise ValueError("invalid or duplicate base setting")
        entries[name] = value
        positions[name] = index

    if entries.get("NIGHTSKY_QUOTA_STATE_PATH") != "/state/provider-quota.json":
        raise ValueError("general quota state is missing")
    if entries.get("NIGHTSKY_PLANNING_CARD_ENABLED") != "false":
        raise ValueError("unexpected base planning card setting")
    if entries.get("NIGHTSKY_WEATHER_PROVIDERS", "met") != "met":
        raise ValueError("unexpected weather provider selection")
    if entries.get("NIGHTSKY_WEATHER_ADMITTED_PROVIDERS", ""):
        raise ValueError("unexpected admitted weather source")
    if "NIGHTSKY_WEATHERAPI_KEY" in entries:
        raise ValueError("WeatherAPI key already present in base configuration")
    if "NIGHTSKY_OPENWEATHER_KEY" in entries:
        raise ValueError("OpenWeather key already present in base configuration")

    for name, value in (
        ("NIGHTSKY_WEATHER_PROVIDERS", "met,weatherapi" + (",openweather" if openweather_admit else "")),
        ("NIGHTSKY_WEATHER_ADMITTED_PROVIDERS", "weatherapi" + (",openweather" if openweather_admit else "")),
        ("NIGHTSKY_PLANNING_CARD_ENABLED", "true" if openweather_admit else "false"),
        ("NIGHTSKY_WEATHERAPI_KEY", weatherapi_key),
    ):
        line = f"{name}={value}"
        if name in positions:
            lines[positions[name]] = line
        else:
            lines.append(line)
    if openweather_admit:
        lines.append(f"NIGHTSKY_OPENWEATHER_KEY={openweather_key}")
    return "\n".join(lines)


if __name__ == "__main__":
    try:
        result = compose(
            os.environ.get("NIGHTSKY_BASE_PRODUCTION_CONFIG", ""),
            os.environ.get("NIGHTSKY_WEATHERAPI_KEY", ""),
            os.environ.get("NIGHTSKY_OPENWEATHER_KEY", ""),
            os.environ.get("NIGHTSKY_OPENWEATHER_ADMIT", "") == "yes",
        )
        sys.stdout.write(result)
    except Exception:
        # Values and source lines must never enter Action logs.
        print("production configuration composition rejected", file=sys.stderr)
        sys.exit(1)
