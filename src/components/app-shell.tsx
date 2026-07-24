import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard, BedDouble, CalendarCheck, Sparkles, Utensils, Clock, ClipboardList,
  BookOpen, Receipt, Users, LineChart, Settings, Menu, Search, Bell, Sun, Moon, LogOut,
  ChevronLeft, X,
} from "lucide-react";
import { useTheme } from "@/lib/theme";
import { notifications } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/rooms", label: "Rooms", icon: BedDouble },
  { to: "/bookings", label: "Bookings", icon: CalendarCheck },
  { to: "/housekeeping", label: "Housekeeping", icon: Sparkles },
  { to: "/tables", label: "Tables", icon: Utensils },
  { to: "/waitlist", label: "Waiting List", icon: Clock },
  { to: "/orders", label: "Orders", icon: ClipboardList },
  { to: "/menu", label: "Menu", icon: BookOpen },
  { to: "/billing", label: "Billing", icon: Receipt },
  { to: "/employees", label: "Employees", icon: Users },
  { to: "/reports", label: "Reports & Revenue", icon: LineChart },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children, title, breadcrumbs }: { children: ReactNode; title?: string; breadcrumbs?: { label: string; to?: string }[] }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex">
      {/* Sidebar - desktop */}
      <aside
        className={cn(
          "hidden md:flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border sticky top-0 h-screen transition-[width] duration-300 ease-out",
          collapsed ? "w-[76px]" : "w-[260px]",
        )}
      >
        <div className="h-16 flex items-center gap-3 px-4 border-b border-sidebar-border">
          <div className="size-9 rounded-xl bg-sidebar-primary flex items-center justify-center shadow-[0_0_20px_-4px_var(--sidebar-primary)]">
            <span className="font-serif font-semibold text-sidebar-primary-foreground text-lg">A</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="font-serif text-lg leading-tight">Aurelia</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/60">Hospitality OS</div>
            </div>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="text-sidebar-foreground/60 hover:text-sidebar-primary transition"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                  active
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60",
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-sidebar-primary shadow-[0_0_10px_var(--sidebar-primary)]" />
                )}
                <Icon className={cn("size-[18px] shrink-0 transition-transform group-hover:scale-110", active && "text-sidebar-primary")} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={cn("border-t border-sidebar-border p-3", collapsed && "px-2")}>
          <div className={cn("rounded-xl p-3 bg-sidebar-accent/60", collapsed && "hidden")}>
            <div className="text-[11px] uppercase tracking-widest text-sidebar-foreground/50">Property</div>
            <div className="font-serif mt-0.5">The Aurelia Grand</div>
            <div className="text-xs text-sidebar-foreground/60 mt-1">Lisbon · Portugal</div>
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-sidebar text-sidebar-foreground p-4 animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-sidebar-primary flex items-center justify-center">
                  <span className="font-serif font-semibold text-sidebar-primary-foreground text-lg">A</span>
                </div>
                <div className="font-serif text-lg">Aurelia</div>
              </div>
              <button onClick={() => setMobileOpen(false)}><X className="size-5" /></button>
            </div>
            <nav className="space-y-1">
              {NAV.map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.to);
                return (
                  <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm",
                      active ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60"
                    )}>
                    <Icon className="size-[18px]" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 pb-20 md:pb-8">
          <div className="px-4 md:px-8 pt-6">
            {breadcrumbs && (
              <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                {breadcrumbs.map((b, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    {b.to ? <Link to={b.to} className="hover:text-foreground">{b.label}</Link> : <span>{b.label}</span>}
                    {i < breadcrumbs.length - 1 && <span className="opacity-40">/</span>}
                  </span>
                ))}
              </div>
            )}
            {title && <h1 className="font-serif text-3xl md:text-4xl mb-6">{title}</h1>}
            {children}
          </div>
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}

function TopNav({ onOpenMobile }: { onOpenMobile: () => void }) {
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="h-16 px-4 md:px-6 flex items-center gap-3">
        <button className="md:hidden p-2 -ml-2" onClick={onOpenMobile}><Menu className="size-5" /></button>

        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search rooms, guests, bookings, orders…" className="pl-9 h-10 rounded-xl bg-muted/50 border-transparent focus-visible:bg-background" />
        </div>

        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="relative h-10 w-10 rounded-xl bg-muted/60 hover:bg-muted flex items-center justify-center transition-all group"
        >
          <Sun className={cn("size-[18px] transition-all duration-500", theme === "dark" ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100")} />
          <Moon className={cn("absolute size-[18px] transition-all duration-500", theme === "dark" ? "rotate-0 scale-100 text-primary" : "-rotate-90 scale-0 opacity-0")} />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative h-10 w-10 rounded-xl bg-muted/60 hover:bg-muted flex items-center justify-center">
              <Bell className="size-[18px]" />
              <span className="absolute top-2 right-2 size-2 rounded-full bg-destructive animate-pulse" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 glass">
            <DropdownMenuLabel className="font-serif text-base">Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.map((n) => (
              <DropdownMenuItem key={n.id} className="flex-col items-start gap-0.5 py-2.5">
                <div className="flex items-center gap-2 w-full">
                  <span className={cn(
                    "size-2 rounded-full",
                    n.kind === "success" && "bg-success",
                    n.kind === "warning" && "bg-warning",
                    n.kind === "alert" && "bg-destructive",
                    n.kind === "info" && "bg-info",
                  )} />
                  <span className="text-sm flex-1">{n.text}</span>
                </div>
                <span className="text-[11px] text-muted-foreground pl-4">{n.time}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 pl-2 pr-1 h-10 rounded-xl hover:bg-muted/60 transition">
              <Avatar className="size-8">
                <AvatarImage src="https://i.pravatar.cc/80?img=12" />
                <AvatarFallback>ME</AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium leading-none">Marcus Ellery</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">General Manager</div>
              </div>
              <Badge variant="secondary" className="hidden md:inline-flex text-[10px] bg-primary/10 text-primary border-primary/20">Admin</Badge>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Preferences</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/" className="flex items-center gap-2"><LogOut className="size-4" /> Sign out</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function MobileBottomNav() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const items = NAV.slice(0, 5);
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-background/90 backdrop-blur-xl border-t border-border">
      <div className="grid grid-cols-5 h-16">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.to);
          return (
            <Link key={item.to} to={item.to} className={cn("flex flex-col items-center justify-center gap-1 text-[10px]", active ? "text-primary" : "text-muted-foreground")}>
              <Icon className="size-5" />
              <span>{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Status badge shared helper
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const map: Record<string, string> = {
    Available: "bg-success/15 text-success border-success/30",
    Free: "bg-success/15 text-success border-success/30",
    "Ready/Clean": "bg-success/15 text-success border-success/30",
    Active: "bg-success/15 text-success border-success/30",
    "Checked-in": "bg-success/15 text-success border-success/30",
    Confirmed: "bg-info/15 text-info border-info/30",
    "In Progress": "bg-info/15 text-info border-info/30",
    Preparing: "bg-info/15 text-info border-info/30",
    Notified: "bg-info/15 text-info border-info/30",
    New: "bg-info/15 text-info border-info/30",
    Reserved: "bg-warning/15 text-warning-foreground [color:var(--warning)] border-warning/30",
    "Awaiting Inspection": "bg-warning/15 [color:var(--warning)] border-warning/30",
    Waiting: "bg-warning/15 [color:var(--warning)] border-warning/30",
    Pending: "bg-warning/15 [color:var(--warning)] border-warning/30",
    "No-Show Risk": "bg-warning/15 [color:var(--warning)] border-warning/30",
    "Needs Cleaning": "bg-warning/15 [color:var(--warning)] border-warning/30",
    "Inspection Pending": "bg-info/15 text-info border-info/30",
    "Cleaning In Progress": "bg-info/15 text-info border-info/30",
    Occupied: "bg-destructive/15 text-destructive border-destructive/30",
    Cancelled: "bg-destructive/15 text-destructive border-destructive/30",
    "No-Show": "bg-destructive/15 text-destructive border-destructive/30",
    Urgent: "bg-destructive/15 text-destructive border-destructive/30",
    High: "bg-destructive/15 text-destructive border-destructive/30",
    Ready: "bg-success/15 text-success border-success/30",
    Served: "bg-muted text-muted-foreground border-border",
    Merged: "bg-special/15 [color:var(--special)] border-special/30",
    Cleaning: "bg-muted text-muted-foreground border-border",
    Maintenance: "bg-muted text-muted-foreground border-border",
    Inactive: "bg-muted text-muted-foreground border-border",
    "On Leave": "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border", map[status] ?? "bg-muted text-muted-foreground border-border", className)}>
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}
