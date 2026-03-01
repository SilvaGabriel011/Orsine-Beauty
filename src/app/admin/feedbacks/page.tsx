export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FeedbacksClient from "./feedbacks-client";

export const metadata: Metadata = {
  title: "Avaliacoes | Admin",
};

export default async function FeedbacksPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = (await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()) as unknown as { data: { role: string } | null };

  if (profile?.role !== "admin") redirect("/");

  // Fetch all reviews with joins
  const { data: reviews } = (await (supabase.from("reviews") as any)
    .select(
      "*, profiles(full_name, email), services(id, name, categories(id, name))"
    )
    .order("created_at", { ascending: false })) as { data: any[] | null };

  // Fetch services for filter
  const { data: services } = (await (supabase.from("services") as any)
    .select("id, name")
    .order("name")) as { data: any[] | null };

  // Stats
  const allReviews = reviews || [];
  const totalReviews = allReviews.length;
  const avgRating =
    totalReviews > 0
      ? allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
        totalReviews
      : 0;
  const pendingCount = allReviews.filter((r: any) => !r.is_visible).length;

  return (
    <FeedbacksClient
      reviews={allReviews}
      services={services || []}
      stats={{
        total: totalReviews,
        average: Math.round(avgRating * 10) / 10,
        pending: pendingCount,
      }}
    />
  );
}
