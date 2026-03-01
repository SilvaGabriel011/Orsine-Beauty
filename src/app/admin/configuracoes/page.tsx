export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { ConfigClient } from "./config-client";
import type { Setting } from "@/types/database";

export const metadata = { title: "Configuracoes" };

export default async function ConfiguracoesPage() {
  const supabase = await createClient();

  const { data: settings } = (await supabase
    .from("settings")
    .select("*")) as unknown as { data: Setting[] | null };

  const settingsMap: Record<string, string> = {};
  settings?.forEach((s) => {
    settingsMap[s.key] = typeof s.value === "string" ? s.value : JSON.stringify(s.value);
  });

  return <ConfigClient initialSettings={settingsMap} />;
}
