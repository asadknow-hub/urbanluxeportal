"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { BrandMark } from "@/components/layout/brand-mark";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const errorMsg = searchParams.get("error");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) {
      toast.error("Sign-in did not return a user");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_active")
      .eq("id", userId)
      .maybeSingle();

    if (!profile) {
      await supabase.auth.signOut();
      toast.error("This login has no staff profile. Ask an admin to create your account from Staff.");
      setLoading(false);
      return;
    }
    if (!profile.is_active) {
      await supabase.auth.signOut();
      toast.error("Your account has been deactivated. Contact an admin.");
      setLoading(false);
      return;
    }

    toast.success("Welcome back");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen w-full">
      <div className="relative hidden w-1/2 overflow-hidden bg-secondary text-secondary-foreground lg:flex lg:flex-col">
        <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(176,137,58,0.18),transparent_45%),radial-gradient(circle_at_20%_80%,rgba(246,243,238,0.08),transparent_40%)]" />
        <div className="absolute inset-y-0 right-0 w-px bg-primary/40" />
        <div className="relative z-10 flex h-full flex-col p-12">
          <BrandMark />
          <div className="flex flex-1 flex-col justify-center">
            <p className="text-sm tracking-[0.2em] text-primary">Dubai · Private</p>
            <h1
              className="mt-4 max-w-md text-5xl leading-[1.1] text-secondary-foreground"
              style={{ fontFamily: "var(--font-display), serif" }}
            >
              The house system for Urban Luxe.
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-secondary-foreground/70">
              Leads, inventory, and finance in one place — built for a Dubai brokerage, not a generic admin panel.
            </p>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col items-center justify-center bg-background p-8 lg:w-1/2">
        <div className="mb-10 lg:hidden">
          <BrandMark inverted />
        </div>
        <div className="w-full max-w-[400px]">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sign in with your UrbanLuxe credentials.</p>

          {errorMsg === "account_deactivated" && (
            <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Your account has been deactivated. Please contact your administrator.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@urbanluxe.ae"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="h-11 pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="h-11 w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
