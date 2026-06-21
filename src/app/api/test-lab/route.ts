import { NextRequest, NextResponse } from "next/server";

// Test Lab API - Uses mock weather data (no external fetch that could crash)
// Real Open-Meteo API structure is simulated with realistic data

interface WeatherBaseline {
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

interface WeatherDrifted {
  latitude: number;
  longitude: number;
  timezone: string;
  current_weather: {
    temp: number;
    humidity: number;
    feels_like: number;
    wind_speed: number;
    condition_code: number;
    is_day: boolean;
  };
  elevation: number;
}

function getBaselineWeather(): WeatherBaseline {
  return {
    latitude: 28.6139,
    longitude: 77.2090,
    timezone: "Asia/Kolkata",
    current: {
      temperature_2m: 36.4,
      relative_humidity_2m: 35,
      apparent_temperature: 38.7,
      wind_speed_10m: 9.9,
      weather_code: 0,
    },
  };
}

function getDriftedWeather(baseline: WeatherBaseline): WeatherDrifted {
  return {
    latitude: baseline.latitude,
    longitude: baseline.longitude,
    timezone: baseline.timezone,
    current_weather: {
      temp: baseline.current.temperature_2m,
      humidity: baseline.current.relative_humidity_2m,
      feels_like: baseline.current.apparent_temperature,
      wind_speed: baseline.current.wind_speed_10m,
      condition_code: baseline.current.weather_code,
      is_day: true,
    },
    elevation: 214,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") || "baseline";

  try {
    const baseline = getBaselineWeather();

    if (mode === "baseline") {
      return NextResponse.json({
        source: "Open-Meteo Weather API (Delhi, India)",
        mode: "baseline",
        endpoint: "/v1/forecast",
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
        response: baseline,
        timestamp: new Date().toISOString(),
      });
    }

    if (mode === "drifted") {
      const drifted = getDriftedWeather(baseline);

      return NextResponse.json({
        source: "Open-Meteo (API schema changed!)",
        mode: "drifted",
        endpoint: "/v1/forecast",
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
          { type: "add_default", from: "current.is_day", to: "current.is_day", confidence: 85, reason: "New field added with default value" },
        ],
        protectedFieldsBlocked: [
          { field: "weather_code → condition_code", reason: "Weather code is in protected list — AI cannot modify" },
        ],
        response: drifted,
        originalResponse: baseline,
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

    return NextResponse.json({ error: "Invalid mode. Use: baseline or drifted" }, { status: 400 });
  } catch (error) {
    console.error("Test lab error:", error);
    return NextResponse.json({ error: "Failed", details: String(error) }, { status: 500 });
  }
}
