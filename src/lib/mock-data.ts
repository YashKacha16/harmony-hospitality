// Rich mock data used across the whole app. UI-only.

export type RoomStatus = "Available" | "Occupied" | "Reserved" | "Cleaning" | "Maintenance" | "Awaiting Inspection";
export interface Room {
  id: string;
  number: string;
  category: "Standard" | "Deluxe" | "Suite" | "Executive";
  price: number;
  capacity: number;
  floor: number;
  status: RoomStatus;
  amenities: string[];
  guest?: string;
  checkOut?: string;
  image: string;
}

const roomImgs = [
  "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=70",
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=70",
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=70",
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=70",
  "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=70",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=70",
];

const cats: Room["category"][] = ["Standard", "Deluxe", "Suite", "Executive"];
const statuses: RoomStatus[] = ["Available", "Occupied", "Reserved", "Cleaning", "Maintenance", "Awaiting Inspection"];
const amenityBank = ["WiFi", "AC", "TV", "Balcony", "Minibar", "Bathtub", "Sea View", "Workspace"];

export const rooms: Room[] = Array.from({ length: 24 }, (_, i) => {
  const cat = cats[i % 4];
  const base = { Standard: 120, Deluxe: 190, Suite: 320, Executive: 480 }[cat];
  const status = statuses[i % 6];
  return {
    id: `r${i + 1}`,
    number: `${(Math.floor(i / 6) + 2) * 100 + (i % 6) + 1}`,
    category: cat,
    price: base + (i % 3) * 25,
    capacity: cat === "Suite" ? 4 : cat === "Executive" ? 3 : 2,
    floor: Math.floor(i / 6) + 2,
    status,
    amenities: amenityBank.slice(0, 4 + (i % 4)),
    guest: status === "Occupied" ? ["Ava Sinclair", "Noah Patel", "Liam Chen", "Sofia Reyes", "Kenji Ito"][i % 5] : undefined,
    checkOut: status === "Occupied" ? "Nov 24" : undefined,
    image: roomImgs[i % roomImgs.length],
  };
});

export type BookingStatus = "Confirmed" | "Checked-in" | "Checked-out" | "Cancelled" | "No-Show" | "No-Show Risk";
export interface Booking {
  id: string;
  guest: string;
  phone: string;
  email: string;
  room: string;
  category: string;
  checkIn: string;
  checkOut: string;
  checkInTime: string;
  guests: number;
  source: "Walk-in" | "Online" | "Phone";
  status: BookingStatus;
  advance: number;
  total: number;
  refund?: { status: "Pending" | "Processed" | "Non-refundable"; amount: number; method: string };
}

const names = ["Ava Sinclair", "Noah Patel", "Liam Chen", "Sofia Reyes", "Kenji Ito", "Isabella Rossi", "Mateo García", "Amelia Novak", "Lucas Bergman", "Zara Malik", "Jonas Weber", "Priya Iyer", "Elena Costa", "Hiro Tanaka", "Freya Lindgren"];

export const bookings: Booking[] = names.map((n, i) => {
  const rm = rooms[i % rooms.length];
  const st: BookingStatus[] = ["Confirmed", "Checked-in", "Confirmed", "No-Show Risk", "Checked-out", "Cancelled", "Confirmed", "Checked-in", "No-Show", "Confirmed"];
  const status = st[i % st.length];
  const advance = rm.price * 0.3;
  return {
    id: `BK-${1000 + i}`,
    guest: n,
    phone: `+1 (555) ${100 + i}-${1000 + i * 3}`,
    email: `${n.toLowerCase().replace(/\s/g, ".")}@mail.com`,
    room: rm.number,
    category: rm.category,
    checkIn: `Nov ${10 + (i % 15)}`,
    checkOut: `Nov ${12 + (i % 15)}`,
    checkInTime: `${13 + (i % 6)}:00`,
    guests: 1 + (i % 3),
    source: (["Walk-in", "Online", "Phone"] as const)[i % 3],
    status,
    advance,
    total: rm.price * (2 + (i % 4)),
    refund: status === "Cancelled" ? { status: (["Pending", "Processed", "Non-refundable"] as const)[i % 3], amount: advance, method: "Original card" } : undefined,
  };
});

export interface MenuItem {
  id: string; name: string; category: string; price: number; veg: boolean; description: string; image: string; available: boolean;
}
const foodImgs = [
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=70",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=70",
  "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=70",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=70",
  "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=600&q=70",
  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&q=70",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=70",
  "https://images.unsplash.com/photo-1432139509613-5c4255815697?w=600&q=70",
];
const itemsByCat: Record<string, string[]> = {
  Starters: ["Truffle Arancini", "Burrata & Heirloom", "Tuna Tataki", "Charred Octopus"],
  "Main Course": ["Wagyu Ribeye", "Miso Black Cod", "Lobster Risotto", "Duck Confit"],
  Beverages: ["Old Fashioned", "Elderflower Spritz", "Cold Brew Tonic", "Yuzu Lemonade"],
  Desserts: ["Valrhona Fondant", "Yuzu Cheesecake", "Pistachio Kulfi", "Basque Burnt"],
  Specials: ["Chef's Tasting", "Truffle Pasta", "Seared Foie Gras"],
  Combos: ["Family Feast", "Business Lunch", "Sunday Brunch"],
};
export const menuItems: MenuItem[] = Object.entries(itemsByCat).flatMap(([cat, list], ci) =>
  list.map((name, i) => ({
    id: `${cat}-${i}`,
    name,
    category: cat,
    price: 12 + ((ci * 7 + i * 5) % 45),
    veg: (ci + i) % 3 === 0,
    description: "Chef-curated, seasonal ingredients, served with house sides.",
    image: foodImgs[(ci * 3 + i) % foodImgs.length],
    available: (ci + i) % 7 !== 0,
  })),
);

export type OrderStatus = "New" | "Preparing" | "Ready" | "Served" | "Cancelled";
export interface Order {
  id: string;
  source: "Dine-in" | "Room Service" | "Parcel";
  ref: string; // table# / room#
  items: { name: string; qty: number; price: number; cancelled?: boolean; addOn?: boolean; reason?: string }[];
  status: OrderStatus;
  elapsed: string;
  total: number;
  priority?: boolean;
}

export const orders: Order[] = [
  { id: "ORD-045", source: "Dine-in", ref: "T-4+5", items: [{ name: "Wagyu Ribeye", qty: 2, price: 62 }, { name: "Truffle Arancini", qty: 1, price: 18 }, { name: "Old Fashioned", qty: 2, price: 16 }], status: "Preparing", elapsed: "12m", total: 174 },
  { id: "ORD-046", source: "Room Service", ref: "Room 305", items: [{ name: "Lobster Risotto", qty: 1, price: 48 }, { name: "Yuzu Lemonade", qty: 1, price: 9 }], status: "Ready", elapsed: "24m", total: 57, priority: true },
  { id: "ORD-047", source: "Parcel", ref: "PCL-201", items: [{ name: "Family Feast", qty: 1, price: 89 }], status: "New", elapsed: "2m", total: 89 },
  { id: "ORD-048", source: "Dine-in", ref: "T-9", items: [{ name: "Miso Black Cod", qty: 2, price: 54 }, { name: "Valrhona Fondant", qty: 2, price: 14, cancelled: true, reason: "Guest changed mind" }], status: "Preparing", elapsed: "8m", total: 108 },
  { id: "ORD-049", source: "Dine-in", ref: "T-2", items: [{ name: "Burrata & Heirloom", qty: 1, price: 22 }, { name: "Elderflower Spritz", qty: 3, price: 14 }, { name: "Duck Confit", qty: 1, price: 38, addOn: true }], status: "Served", elapsed: "48m", total: 102 },
  { id: "ORD-050", source: "Room Service", ref: "Room 412", items: [{ name: "Chef's Tasting", qty: 2, price: 120 }], status: "New", elapsed: "1m", total: 240, priority: true },
];

export interface Employee { id: string; name: string; role: string; contact: string; shift: string; status: string; photo: string; }
export const employees: Employee[] = [
  { id: "E1", name: "Marcus Ellery", role: "Admin", contact: "+1 555-0198", shift: "Morning", status: "Active", photo: "https://i.pravatar.cc/120?img=12" },
  { id: "E2", name: "Priya Iyer", role: "Reception", contact: "+1 555-0122", shift: "Morning", status: "Active", photo: "https://i.pravatar.cc/120?img=47" },
  { id: "E3", name: "Kenji Ito", role: "Cook", contact: "+1 555-0143", shift: "Evening", status: "Active", photo: "https://i.pravatar.cc/120?img=15" },
  { id: "E4", name: "Sofia Reyes", role: "Waiter", contact: "+1 555-0111", shift: "Evening", status: "On Leave", photo: "https://i.pravatar.cc/120?img=45" },
  { id: "E5", name: "Amelia Novak", role: "Housekeeping", contact: "+1 555-0166", shift: "Morning", status: "Active", photo: "https://i.pravatar.cc/120?img=32" },
  { id: "E6", name: "Jonas Weber", role: "Housekeeping", contact: "+1 555-0177", shift: "Night", status: "Active", photo: "https://i.pravatar.cc/120?img=13" },
  { id: "E7", name: "Elena Costa", role: "Waiter", contact: "+1 555-0155", shift: "Evening", status: "Active", photo: "https://i.pravatar.cc/120?img=48" },
  { id: "E8", name: "Hiro Tanaka", role: "Cook", contact: "+1 555-0134", shift: "Night", status: "Active", photo: "https://i.pravatar.cc/120?img=17" },
];

export interface Waitlist { id: string; token: string; name: string; phone: string; party: number; preference: string; waitedMin: number; status: "Waiting" | "Notified" | "Seated" | "No-Show" | "Cancelled"; }
export const waitlist: Waitlist[] = [
  { id: "W1", token: "A21", name: "The Fitzgerald Party", phone: "+1 555-0231", party: 4, preference: "Indoor", waitedMin: 18, status: "Notified" },
  { id: "W2", token: "A22", name: "Devlin Family", phone: "+1 555-0234", party: 6, preference: "Private", waitedMin: 26, status: "Waiting" },
  { id: "W3", token: "A23", name: "Nguyen +1", phone: "+1 555-0287", party: 2, preference: "Outdoor", waitedMin: 8, status: "Waiting" },
  { id: "W4", token: "A24", name: "Bhattacharya", phone: "+1 555-0209", party: 3, preference: "AC", waitedMin: 3, status: "Waiting" },
  { id: "W5", token: "A20", name: "Rowe Party", phone: "+1 555-0210", party: 5, preference: "Indoor", waitedMin: 42, status: "Seated" },
];

export interface Notification { id: string; text: string; time: string; kind: "info" | "success" | "warning" | "alert"; }
export const notifications: Notification[] = [
  { id: "n1", text: "Room 204 checked out — awaiting cleaning", time: "2m ago", kind: "info" },
  { id: "n2", text: "Order #45 ready for pickup at Kitchen", time: "6m ago", kind: "success" },
  { id: "n3", text: "Booking #112 marked as No-Show", time: "15m ago", kind: "alert" },
  { id: "n4", text: "Housekeeping: Suite 501 flagged priority", time: "22m ago", kind: "warning" },
  { id: "n5", text: "New online booking: Ava Sinclair, 3 nights", time: "38m ago", kind: "info" },
];

// Chart data
export const revenueSeries = Array.from({ length: 14 }, (_, i) => ({
  day: `D${i + 1}`,
  room: 2400 + Math.round(Math.sin(i / 2) * 700 + i * 90),
  restaurant: 1400 + Math.round(Math.cos(i / 3) * 500 + i * 60),
}));

export const occupancyBreakdown = [
  { name: "Occupied", value: 14, color: "var(--destructive)" },
  { name: "Available", value: 6, color: "var(--success)" },
  { name: "Cleaning", value: 2, color: "var(--muted-foreground)" },
  { name: "Maintenance", value: 2, color: "var(--warning)" },
];

export const topItems = [
  { name: "Wagyu Ribeye", sold: 128 },
  { name: "Truffle Pasta", sold: 96 },
  { name: "Old Fashioned", sold: 84 },
  { name: "Lobster Risotto", sold: 71 },
  { name: "Chef's Tasting", sold: 58 },
];

export interface Table { id: string; number: string; capacity: number; zone: "Indoor" | "Outdoor" | "AC" | "Private"; status: "Free" | "Occupied" | "Reserved" | "Cleaning" | "Merged"; shape: "round" | "square"; x: number; y: number; mergedWith?: string[]; }
export const tables: Table[] = [
  { id: "t1", number: "T-1", capacity: 2, zone: "Indoor", status: "Free", shape: "round", x: 8, y: 12 },
  { id: "t2", number: "T-2", capacity: 4, zone: "Indoor", status: "Occupied", shape: "square", x: 26, y: 10 },
  { id: "t3", number: "T-3", capacity: 2, zone: "Indoor", status: "Reserved", shape: "round", x: 44, y: 12 },
  { id: "t4", number: "T-4", capacity: 4, zone: "AC", status: "Merged", shape: "square", x: 62, y: 14, mergedWith: ["t5"] },
  { id: "t5", number: "T-5", capacity: 4, zone: "AC", status: "Merged", shape: "square", x: 78, y: 14, mergedWith: ["t4"] },
  { id: "t6", number: "T-6", capacity: 6, zone: "Private", status: "Occupied", shape: "round", x: 10, y: 44 },
  { id: "t7", number: "T-7", capacity: 4, zone: "Indoor", status: "Cleaning", shape: "square", x: 30, y: 42 },
  { id: "t8", number: "T-8", capacity: 2, zone: "Outdoor", status: "Free", shape: "round", x: 50, y: 44 },
  { id: "t9", number: "T-9", capacity: 4, zone: "Outdoor", status: "Occupied", shape: "square", x: 68, y: 46 },
  { id: "t10", number: "T-10", capacity: 8, zone: "Private", status: "Reserved", shape: "round", x: 20, y: 74 },
  { id: "t11", number: "T-11", capacity: 2, zone: "Outdoor", status: "Free", shape: "round", x: 44, y: 76 },
  { id: "t12", number: "T-12", capacity: 4, zone: "AC", status: "Free", shape: "square", x: 66, y: 74 },
];

export interface Housekeeping {
  id: string; room: string; category: string; column: "Needs Cleaning" | "Cleaning In Progress" | "Inspection Pending" | "Ready/Clean";
  lastCleaned: string; assignedTo?: string; priority?: string;
}
export const housekeeping: Housekeeping[] = [
  { id: "hk1", room: "204", category: "Deluxe", column: "Needs Cleaning", lastCleaned: "Yesterday 6pm", priority: "Guest arriving in 1 hr" },
  { id: "hk2", room: "312", category: "Suite", column: "Needs Cleaning", lastCleaned: "Today 8am", assignedTo: "Amelia Novak" },
  { id: "hk3", room: "108", category: "Standard", column: "Cleaning In Progress", lastCleaned: "In progress", assignedTo: "Jonas Weber" },
  { id: "hk4", room: "406", category: "Executive", column: "Cleaning In Progress", lastCleaned: "In progress", assignedTo: "Amelia Novak", priority: "VIP" },
  { id: "hk5", room: "215", category: "Deluxe", column: "Inspection Pending", lastCleaned: "12m ago", assignedTo: "Jonas Weber" },
  { id: "hk6", room: "501", category: "Suite", column: "Ready/Clean", lastCleaned: "1h ago", assignedTo: "Amelia Novak" },
  { id: "hk7", room: "302", category: "Deluxe", column: "Ready/Clean", lastCleaned: "2h ago", assignedTo: "Jonas Weber" },
];

export const maintenanceRequests = [
  { id: "m1", room: "208", issue: "AC not cooling", reportedBy: "Reception", priority: "High" as const, status: "In Progress" },
  { id: "m2", room: "410", issue: "Bathroom leakage", reportedBy: "Housekeeping", priority: "Urgent" as const, status: "Reported" },
  { id: "m3", room: "115", issue: "TV remote not working", reportedBy: "Guest", priority: "Low" as const, status: "Resolved" },
];
