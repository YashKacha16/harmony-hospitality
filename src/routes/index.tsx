import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useTheme } from "@/lib/theme";
import { Sun, Moon, ArrowRight, Sparkles, Eye, EyeOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { settingsService } from "@/api/services/settingsService";
import { BASE_URL } from "@/api/apiClient";

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
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    const savedPw = localStorage.getItem("rememberedPw");
    if (savedEmail && savedPw) {
      setEmail(savedEmail);
      setPw(savedPw);
      setRememberMe(true);
    }
  }, []);

  const { data: settings } = useQuery({
    queryKey: ["settings", "general"],
    queryFn: () => settingsService.getGeneralSettings()
  });

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
          <div className="size-11 rounded-2xl bg-primary flex items-center justify-center copper-glow overflow-hidden">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl.startsWith("http") ? settings.logoUrl : `${BASE_URL}${settings.logoUrl}`} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="font-serif text-primary-foreground text-xl">{settings?.name?.[0]?.toUpperCase() || "A"}</span>
            )}
          </div>
          <div>
            <div className="font-serif text-white text-2xl leading-none">{settings?.name || "Hotel"}</div>
          </div>
        </div>

        <div className="relative z-10 text-white max-w-lg animate-in fade-in slide-in-from-bottom-6 duration-1000">
          <h1 className="font-serif text-5xl leading-[1.05] text-white">
            Welcome to {settings?.name || "Hotel"}
          </h1>
          <p className="mt-5 text-white/70 text-lg">
            Please sign in to access your dashboard.
          </p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex flex-col p-6 lg:p-12">
        <div className="flex justify-end lg:hidden mb-6 items-center gap-3">
          <div className="flex-1 flex items-center gap-2">
            <div className="size-9 rounded-xl bg-primary flex items-center justify-center overflow-hidden">
              {settings?.logoUrl ? (
                <img src={settings.logoUrl.startsWith("http") ? settings.logoUrl : `${BASE_URL}${settings.logoUrl}`} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="font-serif text-primary-foreground">{settings?.name?.[0]?.toUpperCase() || "A"}</span>
              )}
            </div>
            <div className="font-serif text-xl">{settings?.name || "Aurelia"}</div>
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
            <h2 className="font-serif text-4xl mb-2">Sign in to {settings?.name || "Hotel"}</h2>
            <p className="text-muted-foreground mb-8">Enter your credentials to continue.</p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                try {
                  if (rememberMe) {
                    localStorage.setItem("rememberedEmail", email);
                    localStorage.setItem("rememberedPw", pw);
                  } else {
                    localStorage.removeItem("rememberedEmail");
                    localStorage.removeItem("rememberedPw");
                  }
                  
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
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setEmail(val);
                    if (rememberMe) {
                      localStorage.setItem("rememberedEmail", val);
                    }
                  }} 
                  className="h-12 rounded-xl" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pw">Password</Label>
                <div className="relative">
                  <Input 
                    id="pw" 
                    type={showPw ? "text" : "password"} 
                    value={pw} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setPw(val);
                      if (rememberMe) {
                        localStorage.setItem("rememberedPw", val);
                      }
                    }} 
                    className="h-12 rounded-xl pr-10" 
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition cursor-pointer p-1"
                    title={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe} 
                  onCheckedChange={(checked) => {
                    const isChecked = !!checked;
                    setRememberMe(isChecked);
                    if (isChecked) {
                      if (email) localStorage.setItem("rememberedEmail", email);
                      if (pw) localStorage.setItem("rememberedPw", pw);
                    } else {
                      localStorage.removeItem("rememberedEmail");
                      localStorage.removeItem("rememberedPw");
                    }
                  }} 
                />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground cursor-pointer"
                >
                  Remember me
                </label>
              </div>

              <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 group copper-glow">
                {loading ? "Signing in..." : "Enter workspace"}
                <ArrowRight className="size-4 ml-1 transition-transform group-hover:translate-x-0.5" />
              </Button>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
