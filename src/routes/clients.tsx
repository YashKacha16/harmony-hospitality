import { createFileRoute } from "@tanstack/react-router";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Search, Plus, UserCheck, CreditCard, Sparkles, Phone, Mail, Calendar, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/clients")({
  head: () => ({ meta: [{ title: "Clients — Aurelia" }, { name: "description", content: "Client directory, contact info, total revenue contribution and booking history." }] }),
  component: ClientsPage,
});

function ClientsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Fetch client list
  const { data = { items: [], totalItems: 0, totalPages: 1 }, isLoading } = useQuery({
    queryKey: ["clients", search, page],
    queryFn: async () => {
      const res = await fetch(`https://hotel-backend.runasp.net/api/Clients?search=${encodeURIComponent(search)}&page=${page}&pageSize=${pageSize}`);
      if (!res.ok) throw new Error("Failed to load clients");
      return res.json();
    },
    placeholderData: (prev) => prev
  });

  // Fetch client statistics
  const { data: stats = { totalClients: 0, activeGuests: 0, totalRevenue: 0 } } = useQuery({
    queryKey: ["client-stats"],
    queryFn: async () => {
      const res = await fetch("https://hotel-backend.runasp.net/api/Clients/stats");
      if (!res.ok) throw new Error("Failed to load stats");
      return res.json();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`https://hotel-backend.runasp.net/api/Clients/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete client");
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client-stats"] });
      toast.success("Client deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete client");
    }
  });

  return (
    <AppShell title="Clients" breadcrumbs={[{ label: "Home", to: "/dashboard" }, { label: "Clients" }]}>
      {/* Dynamic Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-5 flex items-center justify-between shadow-sm bg-card rounded-2xl border-0">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Total Clients</div>
            <div className="font-serif text-3xl font-bold mt-1 text-foreground">{stats.totalClients}</div>
          </div>
          <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <UserCheck className="size-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between shadow-sm bg-card rounded-2xl border-0">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-medium">In-House Guests</div>
            <div className="font-serif text-3xl font-bold mt-1 text-foreground">{stats.activeGuests}</div>
          </div>
          <div className="size-12 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
            <Sparkles className="size-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between shadow-sm bg-card rounded-2xl border-0">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Customer Revenue</div>
            <div className="font-serif text-3xl font-bold mt-1 text-foreground">₹{stats.totalRevenue.toLocaleString()}</div>
          </div>
          <div className="size-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
            <CreditCard className="size-6" />
          </div>
        </Card>
      </div>

      {/* Control bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center mb-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email or phone..."
            className="pl-9 rounded-xl bg-card border-0"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <AddClientSheet />
      </div>

      {/* Clients Table */}
      <Card className="rounded-2xl border-0 overflow-hidden shadow-sm bg-card">
        {isLoading && data.items.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Loading clients...</div>
        ) : data.items.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No clients found matching the search.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="font-medium">Guest</TableHead>
                  <TableHead className="font-medium">Contact Details</TableHead>
                  <TableHead className="font-medium">Status</TableHead>
                  <TableHead className="font-medium text-center">Bookings</TableHead>
                  <TableHead className="font-medium text-center">Dining Orders</TableHead>
                  <TableHead className="font-medium text-right">Total Contribution</TableHead>
                  <TableHead className="font-medium">Last Check-In</TableHead>
                  <TableHead className="font-medium">Joined</TableHead>
                  <TableHead className="font-medium text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((c: any) => (
                  <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-foreground">
                      <div>{c.name}</div>
                      <div className="text-[10px] text-muted-foreground">Client ID: #{c.id}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="size-3" /> {c.email}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <Phone className="size-3" /> {c.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={c.status === "In-House" ? "Active" : "Inactive"} />
                    </TableCell>
                    <TableCell className="text-center font-medium text-foreground">{c.totalBookings}</TableCell>
                    <TableCell className="text-center font-medium text-foreground">{c.totalOrders}</TableCell>
                    <TableCell className="text-right font-medium text-gold">₹{c.totalSpent.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="size-3" /> {c.lastCheckIn}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <EditClientSheet client={c} />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-lg text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this client?")) {
                              deleteMutation.mutate(c.id);
                            }
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-xs text-muted-foreground">
            Showing Page {page} of {data.totalPages} ({data.totalItems} total clients)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="rounded-lg h-9 text-xs"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={page === data.totalPages}
              onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
              className="rounded-lg h-9 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function AddClientSheet() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });

  const createMutation = useMutation({
    mutationFn: async (client: any) => {
      const res = await fetch("https://hotel-backend.runasp.net/api/Auth/client/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(client)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to register client");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client-stats"] });
      toast.success("Client added successfully");
      setOpen(false);
      setForm({ name: "", email: "", phone: "", password: "" });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to register client");
    }
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="rounded-xl bg-primary text-primary-foreground copper-glow">
          <Plus className="size-4 mr-1" /> Add Client
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl">Register New Client</SheetTitle>
        </SheetHeader>
        <form
          className="mt-6 space-y-4 px-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.name || !form.email || !form.phone) {
              toast.error("Please fill in name, email and phone");
              return;
            }
            createMutation.mutate({ ...form, password: form.password || "Password123" });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Login Password (optional, defaults to Password123)</Label>
            <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <Button type="submit" className="w-full bg-primary text-primary-foreground copper-glow mt-4">
            Register Client
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function EditClientSheet({ client }: { client: any }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: client.name, email: client.email, phone: client.phone });

  const updateMutation = useMutation({
    mutationFn: async (updated: any) => {
      const res = await fetch(`https://hotel-backend.runasp.net/api/Clients/${client.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (!res.ok) throw new Error("Failed to update client");
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client updated successfully");
      setOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update client");
    }
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 rounded-lg text-muted-foreground hover:bg-muted">
          <Edit className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl">Edit Client Details</SheetTitle>
        </SheetHeader>
        <form
          className="mt-6 space-y-4 px-4"
          onSubmit={(e) => {
            e.preventDefault();
            updateMutation.mutate(form);
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Full Name</Label>
            <Input id="edit-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-email">Email Address</Label>
            <Input id="edit-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-phone">Phone Number</Label>
            <Input id="edit-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          </div>
          <Button type="submit" className="w-full bg-primary text-primary-foreground copper-glow mt-4">
            Save Changes
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
