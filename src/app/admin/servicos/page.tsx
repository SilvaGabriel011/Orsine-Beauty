export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { ServicesClient } from "./services-client";

export const metadata = { title: "Servicos" };

export default async function ServicosPage() {
  const supabase = await createClient();

  const { data: services } = (await supabase
    .from("services")
    .select("*, categories(id, name, slug)")
    .order("sort_order")) as unknown as { data: any[] | null };

  const { data: categories } = (await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("sort_order")) as unknown as { data: any[] | null };

  return (
    <ServicesClient
      initialServices={services || []}
      categories={categories || []}
    />
  );
}
