import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/admin/Sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = (await supabase
    .from("profiles")
    .select("full_name, email, role")
    .eq("id", user.id)
    .single()) as unknown as { data: { full_name: string; email: string; role: string } | null };

  // Defense-in-depth: verify admin role even though middleware already checks
  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  const sidebarProfile = {
    name: profile?.full_name ?? user.user_metadata?.name ?? null,
    email: profile?.email ?? user.email ?? null,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar profile={sidebarProfile} />

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
