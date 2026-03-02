import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rate limiter: Map global para armazenar contadores por IP+rota
// Estrutura: Map<"IP:rota", Array<timestamp>>
const rateLimitMap = new Map<string, number[]>();

// Configuração de limites por rota (requests por minuto)
const RATE_LIMITS: Record<string, number> = {
  "/api/games/play": 10,
  "/api/games/checkin": 5,
  "/api/store/redeem": 5,
  "/api/loyalty/redeem": 5,
};

// Funcao para extrair IP do request
function getClientIP(request: NextRequest): string {
  return request.headers.get("x-forwarded-for") ?? request.ip ?? "unknown";
}

// Funcao para limpar entradas antigas do Map (mais de 2 minutos)
function cleanupOldEntries(): void {
  const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
  for (const [key, timestamps] of rateLimitMap.entries()) {
    const recentTimestamps = timestamps.filter((ts) => ts > twoMinutesAgo);
    if (recentTimestamps.length === 0) {
      rateLimitMap.delete(key);
    } else if (recentTimestamps.length < timestamps.length) {
      rateLimitMap.set(key, recentTimestamps);
    }
  }
}

// Funcao para verificar rate limit com sliding window de 60 segundos
function checkRateLimit(ip: string, route: string): { allowed: boolean; retryAfter?: number } {
  const key = `${ip}:${route}`;
  const limit = RATE_LIMITS[route];

  if (!limit) {
    return { allowed: true };
  }

  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;

  // Busca timestamps existentes para este IP+rota
  let timestamps = rateLimitMap.get(key) ?? [];

  // Remove timestamps mais antigos que 1 minuto
  timestamps = timestamps.filter((ts) => ts > oneMinuteAgo);

  // Verifica se atingiu o limite
  if (timestamps.length >= limit) {
    // Calcula quanto tempo falta para liberar (baseado no timestamp mais antigo)
    const oldestTimestamp = timestamps[0];
    const retryAfter = Math.ceil((oldestTimestamp + 60 * 1000 - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Adiciona timestamp atual
  timestamps.push(now);
  rateLimitMap.set(key, timestamps);

  return { allowed: true };
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // TAREFA 1: Rate limiting no início da função middleware
  // Verifica se a rota está sujeita a rate limiting
  const rateLimitRoute = Object.keys(RATE_LIMITS).find((route) => pathname.startsWith(route));

  if (rateLimitRoute) {
    const clientIP = getClientIP(request);
    const { allowed, retryAfter } = checkRateLimit(clientIP, rateLimitRoute);

    if (!allowed) {
      // Cleanup periodico: a cada request, limpa entradas antigas
      cleanupOldEntries();

      return NextResponse.json(
        {
          error: {
            code: "SYS_RATE_LIMIT",
            message: "Muitas tentativas. Tente novamente em alguns minutos.",
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter || 60),
          },
        }
      );
    }

    // Cleanup periodico: a cada request bem-sucedido, limpa entradas antigas
    cleanupOldEntries();
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase is not configured, redirect protected routes to home
  if (!url || !anonKey) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    return NextResponse.redirect(redirectUrl);
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // Protect client routes
  if (pathname.startsWith("/cliente")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*", "/cliente/:path*", "/api/games/:path*", "/api/store/:path*", "/api/loyalty/:path*"],
};
