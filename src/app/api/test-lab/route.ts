import { NextRequest, NextResponse } from "next/server";

// Real weather API (Open-Meteo — free, no API key needed)
const WEATHER_API = "https://api.open-meteo.com/v1/forecast";

interface WeatherResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    wind_speed_10m: number;
    weather_code: number;
  };
}

// Simulated "drifted" version of the weather response
// This mimics what happens when the API provider changes their schema
interface DriftedWeatherResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  current_weather: {
    temp: number;                    // was: temperature_2m
    humidity: number;                // was: relative_humidity_2m
    feels_like: number;              // was: apparent_temperature
    wind_speed: number;              // was: wind_speed_10m (renamed)
    condition_code: number;          // was: weather_code (renamed)
    is_day: boolean;                 // NEW field
  };
  elevation: number;                 // NEW top-level field
}

async function fetchRealWeather(): Promise<WeatherResponse> {
  const url = `${WEATHER_API}?latitude=28.6139&longitude=77.2090&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&timezone=Asia%2FCalcutta&forecast_days=1`;
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    if (data.error) throw new Error(data.reason || "API error");
    return data as WeatherResponse;
  } catch {
    // Fallback: return mock data if API is rate-limited
    return {
      latitude: 28.6139,
      longitude: 77.2090,
      timezone: "Asia/Kolkata",
      current: {
        temperature_2m: 34.5,
        relative_humidity_2m: 62,
        apparent_temperature: 38.2,
        wind_speed_10m: 12.4,
        weather_code: 1,
      },
    };
  }
}

function simulateDrift(original: WeatherResponse): DriftedWeatherResponse {
  return {
    latitude: original.latitude,
    longitude: original.longitude,
    timezone: original.timezone,
    current_weather: {
      temp: original.current.temperature_2m,
      humidity: original.current.relative_humidity_2m,
      feels_like: original.current.apparent_temperature,
      wind_speed: original.current.wind_speed_10m,
      condition_code: original.current.weather_code,
      is_day: true,
    },
    elevation: 216,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") || "baseline";

  try {
    const weather = await fetchRealWeather();

    if (mode === "baseline") {
      // Return the real API response — this is what SDK learns as baseline
      return NextResponse.json({
        source: "open-meteo",
        mode: "baseline",
        endpoint: "/v1/forecast (Delhi, India)",
        schema: {
          latitude: "number",
          longitude: "number",
          timezone: "string",
          current: {
            temperature_2m: "number",
            relative_humidity_2m: "number",
            apparent_temperature: "number",
            wind_speed_10m: "number",
            weather_code: "number",
          },
        },
        response: weather,
        timestamp: new Date().toISOString(),
      });
    }

    if (mode === "drifted") {
      // Return a "drifted" version — simulating API provider changing their schema
      const drifted = simulateDrift(weather);
      return NextResponse.json({
        source: "open-meteo (simulated drift)",
        mode: "drifted",
        endpoint: "/v1/forecast (Delhi, India)",
        schema: {
          latitude: "number",
          longitude: "number",
          timezone: "string",
          current_weather: {
            temp: "number",
            humidity: "number",
            feels_like: "number",
            wind_speed: "number",
            condition_code: "number",
            is_day: "boolean",
          },
          elevation: "number",
        },
        driftDetected: [
          { type: "rename", from: "current.temperature_2m", to: "current_weather.temp", severity: "medium", confidence: 92 },
          { type: "rename", from: "current.relative_humidity_2m", to: "current_weather.humidity", severity: "medium", confidence: 94 },
          { type: "rename", from: "current.apparent_temperature", to: "current_weather.feels_like", severity: "medium", confidence: 91 },
          { type: "rename", from: "current.wind_speed_10m", to: "current_weather.wind_speed", severity: "medium", confidence: 88 },
          { type: "rename", from: "current.weather_code", to: "current_weather.condition_code", severity: "medium", confidence: 86 },
          { type: "missing_field", from: "current", to: "undefined", severity: "high", confidence: 95 },
          { type: "new_field", from: "current_weather.is_day", to: "boolean", severity: "low", confidence: 99 },
          { type: "new_field", from: "elevation", to: "number", severity: "low", confidence: 99 },
        ],
        patchesGenerated: [
          { type: "rename", from: "current_weather.temp", to: "current.temperature_2m", confidence: 92, reason: "Field renamed from temperature_2m to temp" },
          { type: "rename", from: "current_weather.humidity", to: "current.relative_humidity_2m", confidence: 94, reason: "Field renamed from relative_humidity_2m to humidity" },
          { type: "rename", from: "current_weather.feels_like", to: "current.apparent_temperature", confidence: 91, reason: "Field renamed from apparent_temperature to feels_like" },
          { type: "add_default", from: "current.is_day", to: "current.is_day", value: true, confidence: 85, reason: "New field added with default value" },
        ],
        protectedFieldsBlocked: [
          { field: "weather_code → condition_code", reason: "Weather code is in protected list" },
        ],
        response: drifted,
        originalResponse: weather,
        patchedResponse: {
          latitude: drifted.latitude,
          longitude: drifted.longitude,
          timezone: drifted.timezone,
          current: {
            temperature_2m: drifted.current_weather.temp,
            relative_humidity_2m: drifted.current_weather.humidity,
            apparent_temperature: drifted.current_weather.feels_like,
            wind_speed_10m: drifted.current_weather.wind_speed,
            weather_code: drifted.current_weather.condition_code,
            is_day: drifted.current_weather.is_day,
          },
          elevation: drifted.elevation,
        },
        overallConfidence: 90,
        autoPatch: false,
        timestamp: new Date().toISOString(),
      });
    }

    if (mode === "analyze") {
      // Run full Poly analysis on the drift
      const original = weather;
      const drifted = simulateDrift(weather);

      // Call internal analyze-drift
      try {
        const analysisRes = await fetch(new URL("/api/analyze-drift", req.url), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: "proj_demo_01",
            endpoint: "/v1/forecast",
            method: "GET",
            expectedSchema: {
              latitude: "number",
              longitude: "number",
              timezone: "string",
              "current.temperature_2m": "number",
              "current.relative_humidity_2m": "number",
              "current.apparent_temperature": "number",
              "current.wind_speed_10m": "number",
              "current.weather_code": "number",
            },
            actualSchema: {
              latitude: "number",
              longitude: "number",
              timezone: "string",
              "current_weather.temp": "number",
              "current_weather.humidity": "number",
              "current_weather.feels_like": "number",
              "current_weather.wind_speed": "number",
              "current_weather.condition_code": "number",
              "current_weather.is_day": "boolean",
              elevation: "number",
            },
            rules: [
              { type: "protected", field: "weather_code", action: "block" },
              { type: "safe", field: "temperature", action: "allow" },
              { type: "safe", field: "humidity", action: "allow" },
              { type: "safe", field: "wind_speed", action: "allow" },
            ],
          }),
        });

        const analysis = await analysisRes.json();
        return NextResponse.json({
          source: "open-meteo + Poly Cloud Analysis",
          mode: "full-analysis",
          originalResponse: original,
          driftedResponse: drifted,
          analysis,
          timestamp: new Date().toISOString(),
        });
      } catch {
        return NextResponse.json({
          source: "open-meteo",
          mode: "full-analysis-fallback",
          originalResponse: original,
          driftedResponse: drifted,
          analysis: { error: "Analysis engine unavailable" },
          timestamp: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({ error: "Invalid mode. Use: baseline, drifted, or analyze" }, { status: 400 });
  } catch (error) {
    console.error("Test lab error:", error);
    return NextResponse.json({ error: "Failed to fetch weather data", details: String(error) }, { status: 500 });
  }
}
