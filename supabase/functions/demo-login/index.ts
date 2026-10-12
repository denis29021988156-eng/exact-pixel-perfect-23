// Вход в демо без пароля: выдаёт сессию демо-губернатора или демо-команды.
// Работает только при включённом демо-режиме (app_settings.demo_mode).

import { adminClient, json, preflight, publicClient } from "../_shared/http.ts";

const DEMO_ACCOUNTS: Record<"governor" | "team", string> = {
  governor: "governor.demo@neurasystems.pro",
  team: "team.demo@neurasystems.pro",
};

Deno.serve(async (req) => {
  const early = preflight(req);
  if (early) return early;

  try {
    const body = await req.json().catch(() => ({}));
    const role = body?.role === "team" ? "team" : body?.role === "governor" ? "governor" : null;
    if (!role) return json({ error: "Неизвестная роль демо" }, 400);

    const admin = adminClient();
    const { data: settings, error: settingsError } = await admin
      .from("app_settings")
      .select("demo_mode")
      .eq("id", 1)
      .maybeSingle();
    if (settingsError) {
      console.error("settings", settingsError);
      return json({ error: "Демо временно недоступно" }, 500);
    }
    if (!settings?.demo_mode) return json({ error: "Демо-режим выключен" }, 403);

    const email = DEMO_ACCOUNTS[role];
    const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: "magiclink", email });
    const tokenHash = link?.properties?.hashed_token;
    if (linkError || !tokenHash) {
      console.error("generateLink", linkError);
      return json({ error: "Не удалось открыть демо" }, 500);
    }

    // Обмениваем одноразовый токен на обычную сессию.
    const pub = publicClient();
    let { data, error } = await pub.auth.verifyOtp({ type: "email", token_hash: tokenHash });
    if (error || !data?.session) {
      ({ data, error } = await pub.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash }));
    }
    if (error || !data?.session) {
      console.error("verifyOtp", error);
      return json({ error: "Не удалось открыть демо" }, 500);
    }

    return json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  } catch (err) {
    console.error("demo-login", err);
    return json({ error: "Не удалось открыть демо" }, 500);
  }
});
