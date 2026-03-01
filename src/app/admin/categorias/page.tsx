export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { CategoriesClient } from "./categories-client";

export const metadata = { title: "Categorias" };

export default async function CategoriasPage() {
  const supabase = await createClient();

  const { data: categories } = (await supabase
    .from("categories")
    .select("*, services(count)")
    .order("sort_order")) as unknown as { data: any[] | null };

  return <CategoriesClient initialCategories={categories || []} />;
}
