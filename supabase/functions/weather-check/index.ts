// Weather check — каждые 6 часов проверяет прогноз на 72ч и создаёт алармы.
// Источник: Open-Meteo (без ключа). Город берётся из app_settings.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Пороги тревоги
const RAIN_MM_PER_HOUR = 8;        // ливень: > 8 мм/ч
const SNOW_CM_TOTAL = 10;          // сильный снег: > 10 см за 72ч
const HEAT_C = 32;                 // жара: > 32°C минимум 3 часа подряд
const COLD_C = -25;                // мороз: < -25°C минимум 3 часа подряд
const WIND_MS = 20;                // штормовой ветер: > 20 м/с

interface HourPoint {
  time: string;
  temp: number;
  rain: number;     // мм
  snow: number;     // см
  wind: number;     // м/с
}

interface AlertCandidate {
  alert_type: "heavy_rain" | "heavy_snow" | "extreme_heat" | "extreme_cold" | "storm";
  severity: "info" | "warning" | "danger";
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  peak_value: number;
  peak_unit: string;
}

function detectAlerts(hours: HourPoint[]): AlertCandidate[] {
  const alerts: AlertCandidate[] = [];
  if (hours.length === 0) return alerts;

  // Ливень — пиковый час
  const peakRain = hours.reduce((m, h) => h.rain > m.rain ? h : m, hours[0]);
  if (peakRain.rain >= RAIN_MM_PER_HOUR) {
    alerts.push({
      alert_type: "heavy_rain",
      severity: peakRain.rain >= 15 ? "danger" : "warning",
      title: `Ливень ${peakRain.rain.toFixed(1)} мм/ч`,
      description: `Прогноз сильных осадков. Пик: ${new Date(peakRain.time).toLocaleString("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}. Риск подтоплений, обращений по ливневке.`,
      starts_at: hours.find(h => h.rain >= RAIN_MM_PER_HOUR)?.time ?? peakRain.time,
      ends_at: [...hours].reverse().find(h => h.rain >= RAIN_MM_PER_HOUR)?.time ?? peakRain.time,
      peak_value: peakRain.rain,
      peak_unit: "мм/ч",
    });
  }

  // Снег — суммарно за окно
  const totalSnow = hours.reduce((s, h) => s + (h.snow || 0), 0);
  if (totalSnow >= SNOW_CM_TOTAL) {
    const firstSnowHour = hours.find(h => h.snow > 0)!;
    const lastSnowHour = [...hours].reverse().find(h => h.snow > 0)!;
    alerts.push({
      alert_type: "heavy_snow",
      severity: totalSnow >= 20 ? "danger" : "warning",
      title: `Снегопад ${totalSnow.toFixed(0)} см за 72ч`,
      description: `Сильные снегопады. Подготовить уборочную технику и реагент. Риск аварий и срыва транспорта.`,
      starts_at: firstSnowHour.time,
      ends_at: lastSnowHour.time,
      peak_value: totalSnow,
      peak_unit: "см",
    });
  }

  // Жара — 3+ часов подряд > HEAT_C
  let heatRun: HourPoint[] = [];
  let bestHeat: HourPoint[] = [];
  for (const h of hours) {
    if (h.temp >= HEAT_C) heatRun.push(h);
    else { if (heatRun.length > bestHeat.length) bestHeat = heatRun; heatRun = []; }
  }
  if (heatRun.length > bestHeat.length) bestHeat = heatRun;
  if (bestHeat.length >= 3) {
    const peak = bestHeat.reduce((m, h) => h.temp > m.temp ? h : m, bestHeat[0]);
    alerts.push({
      alert_type: "extreme_heat",
      severity: peak.temp >= 35 ? "danger" : "warning",
      title: `Жара до ${peak.temp.toFixed(0)}°C`,
      description: `Аномальная жара ${bestHeat.length}ч подряд. Усилить контроль соц. объектов (детсады, больницы), точки питьевой воды.`,
      starts_at: bestHeat[0].time,
      ends_at: bestHeat[bestHeat.length - 1].time,
      peak_value: peak.temp,
      peak_unit: "°C",
    });
  }

  // Мороз — 3+ часов подряд < COLD_C
  let coldRun: HourPoint[] = [];
  let bestCold: HourPoint[] = [];
  for (const h of hours) {
    if (h.temp <= COLD_C) coldRun.push(h);
    else { if (coldRun.length > bestCold.length) bestCold = coldRun; coldRun = []; }
  }
  if (coldRun.length > bestCold.length) bestCold = coldRun;
  if (bestCold.length >= 3) {
    const peak = bestCold.reduce((m, h) => h.temp < m.temp ? h : m, bestCold[0]);
    alerts.push({
      alert_type: "extreme_cold",
      severity: "danger",
      title: `Мороз до ${peak.temp.toFixed(0)}°C`,
      description: `Сильные морозы ${bestCold.length}ч подряд. Риск аварий ЖКХ, подготовить пункты обогрева.`,
      starts_at: bestCold[0].time,
      ends_at: bestCold[bestCold.length - 1].time,
      peak_value: peak.temp,
      peak_unit: "°C",
    });
  }

  // Шторм
  const peakWind = hours.reduce((m, h) => h.wind > m.wind ? h : m, hours[0]);
  if (peakWind.wind >= WIND_MS) {
    alerts.push({
      alert_type: "storm",
      severity: peakWind.wind >= 25 ? "danger" : "warning",
      title: `Штормовой ветер ${peakWind.wind.toFixed(0)} м/с`,
      description: `Риск падения деревьев, обрывов ЛЭП, повреждения кровли.`,
      starts_at: peakWind.time,
      ends_at: peakWind.time,
      peak_value: peakWind.wind,
      peak_unit: "м/с",
    });
  }

  return alerts;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // --- Auth: CRON_SECRET header OR signed-in user ---
  {
    const _cronSecret = Deno.env.get("CRON_SECRET");
    const _hdrSecret = req.headers.get("x-cron-secret");
    let _ok = !!(_cronSecret && _hdrSecret && _cronSecret === _hdrSecret);
    if (!_ok) {
      const _authHeader = req.headers.get("Authorization");
      if (_authHeader?.startsWith("Bearer ")) {
        const _supaAuth = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!
        );
        const { data: _claims, error: _authErr } = await _supaAuth.auth.getClaims(
          _authHeader.replace("Bearer ", "")
        );
        _ok = !_authErr && !!_claims?.claims;
      }
    }
    if (!_ok) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Город из app_settings (определяется по «названию планшета»)
    const { data: settings, error: settingsErr } = await supabase
      .from("app_settings")
      .select("city_name, city_lat, city_lng")
      .eq("id", 1)
      .single();
    if (settingsErr) throw new Error(`app_settings: ${settingsErr.message}`);

    let { city_name, city_lat, city_lng } = settings;

    // 2. Если координат нет — геокодим через Open-Meteo (без ключа)
    if (!city_lat || !city_lng) {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city_name)}&count=1&language=ru&format=json`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();
      const hit = geoData?.results?.[0];
      if (!hit) throw new Error(`Не найден город: ${city_name}`);
      city_lat = hit.latitude;
      city_lng = hit.longitude;
      await supabase.from("app_settings").update({ city_lat, city_lng, updated_at: new Date().toISOString() }).eq("id", 1);
    }

    // 3. Прогноз на 72 часа
    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${city_lat}&longitude=${city_lng}&current=temperature_2m,weather_code,wind_speed_10m,precipitation&hourly=temperature_2m,precipitation,snowfall,wind_speed_10m,weather_code&forecast_days=4&timezone=auto&wind_speed_unit=ms`;
    const forecastRes = await fetch(forecastUrl);
    if (!forecastRes.ok) throw new Error(`Open-Meteo HTTP ${forecastRes.status}`);
    const forecast = await forecastRes.json();

    const hourly = forecast.hourly;
    const hours: HourPoint[] = (hourly.time as string[]).slice(0, 72).map((t: string, i: number) => ({
      time: t,
      temp: hourly.temperature_2m[i],
      rain: hourly.precipitation[i] ?? 0,
      snow: hourly.snowfall[i] ?? 0,
      wind: hourly.wind_speed_10m[i] ?? 0,
    }));

    const candidates = detectAlerts(hours);

    // 4. Дедуп: уникальный индекс на (city, type, starts_at) — используем upsert
    let inserted = 0;
    for (const c of candidates) {
      const { error } = await supabase.from("weather_alerts").upsert({
        city_name,
        alert_type: c.alert_type,
        severity: c.severity,
        title: c.title,
        description: c.description,
        starts_at: c.starts_at,
        ends_at: c.ends_at,
        peak_value: c.peak_value,
        peak_unit: c.peak_unit,
        raw_forecast: { source: "open-meteo", city_lat, city_lng },
      }, { onConflict: "city_name,alert_type,starts_at", ignoreDuplicates: true });
      if (!error) inserted++;

      // 5. Эскалация мэру — для warning/danger
      if (c.severity !== "info") {
        await supabase.from("escalations").insert({
          type: "weather",
          severity: c.severity === "danger" ? 5 : 4,
          source_type: "weather_alert",
          message: `Погодная угроза: ${c.title}`,
          suggested_action: c.description,
        });
      }
    }

    // 6. Снимок для виджета
    await supabase.from("weather_snapshot").update({
      city_name,
      fetched_at: new Date().toISOString(),
      current: forecast.current,
      forecast_72h: hours,
      active_alerts: candidates.length,
    }).eq("id", 1);

    return new Response(JSON.stringify({
      ok: true,
      city: city_name,
      hours_analyzed: hours.length,
      alerts_found: candidates.length,
      alerts_inserted: inserted,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("weather-check error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});