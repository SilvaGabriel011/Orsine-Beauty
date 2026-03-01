export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import StarRating from "@/components/reviews/StarRating";

export const metadata: Metadata = {
  title: "Depoimentos | Bela Orsine Beauty",
  description: "Veja o que nossas clientes dizem sobre nossos servicos",
};

export default async function DepoimentosPage() {
  let reviews: any[] | null = null;

  try {
    const supabase = await createClient();
    const result = (await (supabase.from("reviews") as any)
      .select(
        "id, rating, comment, created_at, profiles(full_name), services(name, categories(name))"
      )
      .eq("is_visible", true)
      .order("rating", { ascending: false })
      .order("created_at", { ascending: false })) as { data: any[] | null };
    reviews = result.data;
  } catch {
    // Supabase not configured
  }

  // Stats
  const totalReviews = reviews?.length || 0;
  const avgRating =
    totalReviews > 0
      ? Math.round(
          (reviews!.reduce((sum: number, r: any) => sum + r.rating, 0) /
            totalReviews) *
            10
        ) / 10
      : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          O que nossas clientes dizem
        </h1>
        <p className="mt-2 text-gray-500">
          Avaliacoes reais de quem ja experimentou nossos servicos
        </p>
        {totalReviews > 0 && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <StarRating rating={Math.round(avgRating)} readonly size="md" />
            <span className="text-lg font-bold text-gray-900">
              {avgRating}
            </span>
            <span className="text-sm text-gray-500">
              ({totalReviews} avaliacao{totalReviews !== 1 ? "oes" : ""})
            </span>
          </div>
        )}
      </div>

      {!reviews || reviews.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          Nenhuma avaliacao ainda. Seja a primeira!
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {reviews.map((review: any) => {
            const initials = review.profiles?.full_name
              ? review.profiles.full_name
                  .split(" ")
                  .map((n: string) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()
              : "?";

            return (
              <Card key={review.id}>
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-sm font-bold text-rose-600">
                      {initials}
                    </div>
                    <div>
                      <p className="font-medium">
                        {review.profiles?.full_name || "Cliente"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {review.services?.name}
                        {review.services?.categories?.name &&
                          ` · ${review.services.categories.name}`}
                      </p>
                    </div>
                  </div>
                  <StarRating
                    rating={review.rating}
                    readonly
                    size="sm"
                  />
                  {review.comment && (
                    <p className="mt-3 text-sm leading-relaxed text-gray-600">
                      &ldquo;{review.comment}&rdquo;
                    </p>
                  )}
                  <p className="mt-3 text-xs text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString("pt-BR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
