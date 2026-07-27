import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/lib/theme";
import { Sun, Moon, ArrowRight, Sparkles } from "lucide-react";

import { toast } from "sonner";
import { authService } from "@/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — Aurelia Hospitality OS" },
      { name: "description", content: "Sign in to Aurelia, the boutique hotel and restaurant operations platform." },
      { property: "og:title", content: "Sign in — Aurelia" },
      { property: "og:description", content: "The operations platform for modern hospitality brands." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const { theme, toggle } = useTheme();
  const [email, setEmail] = useState("manager@aurelia.co");
  const [pw, setPw] = useState("aurelia•2026");
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1400&q=80"
          alt="The Aurelia Grand, Lisbon"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.18_0.03_265)]/85 via-[oklch(0.18_0.03_265)]/60 to-[oklch(0.3_0.1_55)]/40" />
        <div className="relative z-10 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="size-11 rounded-2xl bg-primary flex items-center justify-center copper-glow">
            <span className="font-serif text-primary-foreground text-xl">A</span>
          </div>
          <div>
            <div className="font-serif text-white text-2xl leading-none">Aurelia</div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-white/70 mt-1">Hospitality OS</div>
          </div>
        </div>

        <div className="relative z-10 text-white max-w-lg animate-in fade-in slide-in-from-bottom-6 duration-1000">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-primary/90 mb-4">
            <Sparkles className="size-3.5" /> Trusted by 240+ boutique properties
          </div>
          <h1 className="font-serif text-5xl leading-[1.05] text-white">
            The quiet software behind extraordinary stays.
          </h1>
          <p className="mt-5 text-white/70 text-lg">
            Aurelia unifies your front desk, restaurant floor, housekeeping and revenue in one calm, considered workspace.
          </p>

          <div className="mt-10 flex gap-6 text-white/60 text-xs uppercase tracking-widest">
            <span>Front Desk</span><span>·</span><span>Restaurant</span><span>·</span><span>Housekeeping</span><span>·</span><span>Revenue</span>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex flex-col p-6 lg:p-12">
        <div className="flex justify-end lg:hidden mb-6 items-center gap-3">
          <div className="flex-1 flex items-center gap-2">
            <div className="size-9 rounded-xl bg-primary flex items-center justify-center">
              <span className="font-serif text-primary-foreground">A</span>
            </div>
            <div className="font-serif text-xl">Aurelia</div>
          </div>
          <button onClick={toggle} className="size-10 rounded-xl bg-muted flex items-center justify-center">
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>

        <div className="hidden lg:flex justify-end">
          <button onClick={toggle} className="size-10 rounded-xl bg-muted hover:bg-accent flex items-center justify-center transition">
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-right-6 duration-700">
            <div className="text-xs uppercase tracking-[0.24em] text-primary mb-3">Welcome back</div>
            <h2 className="font-serif text-4xl mb-2">Sign in to Aurelia</h2>
            <p className="text-muted-foreground mb-8">Manage your property with clarity and calm.</p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                try {
                  const res = await authService.login({ email, password: pw });
                  localStorage.setItem("user", JSON.stringify(res.employee));
                  toast.success("Welcome back, " + res.employee.name);
                  nav({ to: "/dashboard" });
                } catch (err: any) {
                  toast.error(err.message || "Invalid credentials");
                } finally {
                  setLoading(false);
                }
              }}
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl" required />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="pw">Password</Label>
                  <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
                </div>
                <Input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="h-12 rounded-xl" required />
              </div>

              <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 group copper-glow">
                {loading ? "Signing in..." : "Enter workspace"}
                <ArrowRight className="size-4 ml-1 transition-transform group-hover:translate-x-0.5" />
              </Button>

              <div className="text-xs text-center text-muted-foreground pt-2">
                By continuing you agree to Aurelia's Terms & Privacy.
              </div>
            </form>

            <div className="mt-10 pt-6 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
              <span>New to Aurelia?</span>
              <Link to="/dashboard" className="text-primary hover:underline">Explore a demo →</Link>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground text-center lg:text-left">
          © 2026 Aurelia Hospitality Systems
        </div>
      </div>
    </div>
  );
}
