import { createFileRoute } from "@tanstack/react-router";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { employees } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload, Phone } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/employees")({
  head: () => ({ meta: [{ title: "Employees — Aurelia" }, { name: "description", content: "Team directory, roles, shifts and attendance for hotel & restaurant staff." }] }),
  component: EmpPage,
});

function EmpPage() {
  const shifts = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <AppShell title="Employees" breadcrumbs={[{ label: "Home", to: "/dashboard" }, { label: "Employees" }]}>
      <div className="flex justify-end mb-4"><AddEmpSheet /></div>

      <Tabs defaultValue="directory">
        <TabsList className="rounded-xl mb-4">
          <TabsTrigger value="directory" className="rounded-lg">Directory</TabsTrigger>
          <TabsTrigger value="attendance" className="rounded-lg">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {employees.map(e => (
            <Card key={e.id} className="p-5 rounded-2xl">
              <div className="flex items-center gap-3">
                <Avatar className="size-14"><AvatarImage src={e.photo} /><AvatarFallback>{e.name[0]}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{e.name}</div>
                  <div className="text-xs text-muted-foreground">{e.role}</div>
                </div>
                <StatusBadge status={e.status} />
              </div>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5"><Phone className="size-3" /> {e.contact}</div>
                <div>Shift: <span className="text-foreground">{e.shift}</span></div>
              </div>
              <div className="mt-3">
                <Select defaultValue={e.role}>
                  <SelectTrigger className="h-8 rounded-lg text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{["Admin", "Reception", "Waiter", "Cook", "Housekeeping"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="attendance">
          <Card className="p-4 rounded-2xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <th className="px-3 py-2">Employee</th>
                  {shifts.map(s => <th key={s} className="px-2 py-2 text-center">{s}</th>)}
                </tr>
              </thead>
              <tbody>
                {employees.map((e, ei) => (
                  <tr key={e.id} className="border-t border-border">
                    <td className="px-3 py-2 flex items-center gap-2"><Avatar className="size-6"><AvatarImage src={e.photo} /><AvatarFallback>{e.name[0]}</AvatarFallback></Avatar>{e.name}</td>
                    {shifts.map((_, i) => {
                      const state = (ei + i) % 5 === 0 ? "off" : (ei + i) % 7 === 0 ? "leave" : "on";
                      return (
                        <td key={i} className="px-2 py-2 text-center">
                          <span className={cn(
                            "inline-block size-6 rounded-md",
                            state === "on" && "bg-success/20",
                            state === "off" && "bg-muted",
                            state === "leave" && "bg-warning/30",
                          )} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-success/30" /> On shift</span>
              <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-muted" /> Off</span>
              <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-warning/30" /> Leave</span>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function AddEmpSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild><Button className="rounded-xl bg-primary text-primary-foreground copper-glow"><Plus className="size-4 mr-1" /> Add employee</Button></SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader><SheetTitle className="font-serif text-2xl">New employee</SheetTitle></SheetHeader>
        <form className="mt-6 space-y-3 px-4" onSubmit={(e) => { e.preventDefault(); toast.success("Employee added"); }}>
          <div><Label>Photo</Label><div className="mt-1 h-20 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 text-xs text-muted-foreground"><Upload className="size-4" /> Upload</div></div>
          <div><Label>Name</Label><Input className="rounded-xl mt-1" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Contact</Label><Input className="rounded-xl mt-1" /></div>
            <div><Label>Email</Label><Input type="email" className="rounded-xl mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Role</Label><Select><SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Waiter" /></SelectTrigger>
              <SelectContent>{["Admin", "Reception", "Waiter", "Cook", "Housekeeping"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select></div>
            <div><Label>Shift</Label><Select><SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Morning" /></SelectTrigger>
              <SelectContent><SelectItem value="m">Morning</SelectItem><SelectItem value="e">Evening</SelectItem><SelectItem value="n">Night</SelectItem></SelectContent>
            </Select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Joining date</Label><Input type="date" className="rounded-xl mt-1" /></div>
            <div><Label>Salary</Label><Input placeholder="$0" className="rounded-xl mt-1" /></div>
          </div>
          <Button className="w-full rounded-xl bg-primary text-primary-foreground copper-glow">Add employee</Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
