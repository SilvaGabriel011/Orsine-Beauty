import { redirect } from "next/navigation";

export default async function AgendarCategoriaPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  const { categorySlug } = await params;
  redirect(`/agendar?category=${categorySlug}`);
}
