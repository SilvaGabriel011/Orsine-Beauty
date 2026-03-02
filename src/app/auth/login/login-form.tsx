"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Login realizado com sucesso!");
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side — cinematic visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-warm-800 via-burgundy-800 to-warm-900" />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[15%] top-[25%] h-[300px] w-[300px] rounded-full bg-burgundy-600/20 blur-[80px]" />
          <div className="absolute right-[10%] bottom-[20%] h-[200px] w-[200px] rounded-full bg-gold-400/10 blur-[60px]" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center px-12">
          <h2 className="font-serif text-4xl tracking-wide text-white xl:text-5xl">
            Bela Orsine
          </h2>
          <p className="mt-2 font-display text-xl italic tracking-widest text-gold-400">
            Beauty
          </p>
          <div className="mx-auto mt-8 h-px w-16 bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
          <p className="mt-8 max-w-sm text-center text-base leading-relaxed text-warm-300">
            Enhance your natural beauty with care, precision and dedication.
          </p>
        </div>
      </div>

      {/* Right side — form */}
      <div className="flex w-full items-center justify-center bg-cream px-4 lg:w-1/2">
        <Card className="w-full max-w-md border-warm-200/50 shadow-xl shadow-burgundy-600/5">
          <CardHeader className="text-center">
            {/* Mobile-only logo */}
            <div className="mb-4 lg:hidden">
              <h2 className="font-serif text-2xl text-warm-900">Bela Orsine</h2>
              <p className="font-display text-sm italic text-burgundy-600">Beauty</p>
            </div>
            <CardTitle className="font-serif text-2xl text-warm-900">
              Welcome back
            </CardTitle>
            <CardDescription className="text-warm-500">
              Sign in to manage your bookings
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-warm-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="rounded-xl border-warm-200 focus:border-burgundy-300 focus:ring-burgundy-200/30"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-warm-700">Password</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-burgundy-600 hover:text-burgundy-700 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                  className="rounded-xl border-warm-200 focus:border-burgundy-300 focus:ring-burgundy-200/30"
                />
              </div>

              <Button
                type="submit"
                className="w-full rounded-xl bg-burgundy-600 text-white hover:bg-burgundy-700 shadow-lg shadow-burgundy-600/20"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-warm-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/cadastro"
                className="font-medium text-burgundy-600 hover:text-burgundy-700 hover:underline"
              >
                Create account
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
