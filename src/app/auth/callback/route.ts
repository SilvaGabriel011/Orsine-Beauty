import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Validate that the redirect URL is safe (relative path only).
 * Prevents open redirect attacks.
 */
function getSafeRedirectUrl(next: string | null, origin: string): string {
  if (!next) return `${origin}/`;

  // Only allow relative paths starting with /
  if (!next.startsWith("/") || next.startsWith("//")) {
    return `${origin}/`;
  }

  // Block protocol-relative URLs and other tricks
  try {
    const url = new URL(next, origin);
    if (url.origin !== origin) {
      return `${origin}/`;
    }
  } catch {
    return `${origin}/`;
  }

  return `${origin}${next}`;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(getSafeRedirectUrl(next, origin));
    }
  }

  // If code exchange fails, redirect to login with an error indication
  return NextResponse.redirect(`${origin}/auth/login?error=callback_failed`);
}
