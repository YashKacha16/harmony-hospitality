import { useState, useRef, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, Shield, Lock, Plus, Trash2, X, Building2, Image as ImageIcon, Clock, Coins, Check, Loader2, Users, MapPin, Mail, Phone, Sliders } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { permissionService, RoleConfig, RolePermissions, PagePermission } from "@/lib/permissionService";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/lib/theme";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsService, GeneralSettings } from "@/api/services/settingsService";
import { chefService, Chef } from "@/api/services/chefService";
import { galleryService, GalleryItem } from "@/api/services/galleryService";
import { BASE_URL } from "@/api/apiClient";
import { getImageUrl } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Aurelia" }, { name: "description", content: "Property configuration: branding, taxes, cancellation tiers, notifications and theme." }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const welcomeImageRef = useRef<HTMLInputElement>(null);
  const heroImageRef = useRef<HTMLInputElement>(null);
  const roomsHeroImageRef = useRef<HTMLInputElement>(null);
  const diningHeroImageRef = useRef<HTMLInputElement>(null);
  const aboutHeroImageRef = useRef<HTMLInputElement>(null);
  const contactHeroImageRef = useRef<HTMLInputElement>(null);
  const galleryHeroImageRef = useRef<HTMLInputElement>(null);
  const chefImageRef = useRef<HTMLInputElement>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsService.getGeneralSettings(),
    staleTime: 1000 * 60 * 5,
  });

  const [form, setForm] = useState<Partial<GeneralSettings>>({});
  const [newAmenity, setNewAmenity] = useState("");
  const [newHourName, setNewHourName] = useState("");
  const [newHourValue, setNewHourValue] = useState("");
  const [is24Hours, setIs24Hours] = useState(false);
  const [timeFrom, setTimeFrom] = useState("07:00");
  const [timeTo, setTimeTo] = useState("11:00");

  // Roles State (fetch from backend)
  const { data: roles = [], refetch: refetchRoles } = useQuery({
    queryKey: ["roles"],
    queryFn: () => permissionService.getRoles()
  });

  const [selectedRole, setSelectedRole] = useState("Admin");
  const [editingPermissions, setEditingPermissions] = useState<RolePermissions | null>(null);
  
  // Dialog State
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");

  // Chefs state
  const { data: chefs = [], refetch: refetchChefs } = useQuery({
    queryKey: ["chefs"],
    queryFn: () => chefService.getChefs()
  });
  const [isChefModalOpen, setIsChefModalOpen] = useState(false);
  const [selectedChef, setSelectedChef] = useState<Chef | null>(null);
  const [chefFormName, setChefFormName] = useState("");
  const [chefFormRole, setChefFormRole] = useState("");
  const [chefFormDescription, setChefFormDescription] = useState("");
  const [chefFormImageUrl, setChefFormImageUrl] = useState("");

  // Gallery state
  const { data: galleryItems = [], refetch: refetchGallery } = useQuery({
    queryKey: ["gallery"],
    queryFn: () => galleryService.getGalleryItems()
  });
  const [galleryDesc, setGalleryDesc] = useState("");
  const [galleryFile, setGalleryFile] = useState<File | null>(null);

  const createGalleryMutation = useMutation({
    mutationFn: ({ desc, file }: { desc: string, file: File | null }) => galleryService.createGalleryItem(desc, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
      toast.success("Gallery item added");
      setGalleryDesc("");
      setGalleryFile(null);
    },
    onError: () => toast.error("Failed to add gallery item")
  });

  const deleteGalleryMutation = useMutation({
    mutationFn: (id: number) => galleryService.deleteGalleryItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
      toast.success("Gallery item deleted");
    },
    onError: () => toast.error("Failed to delete gallery item")
  });

  // Sync editing permissions when selected role changes
  useEffect(() => {
    const roleConfig = roles.find(r => r.name.toLowerCase() === selectedRole.toLowerCase());
    if (roleConfig) {
      setEditingPermissions(JSON.parse(JSON.stringify(roleConfig.permissions)));
    }
  }, [selectedRole, roles]);

  // Initialize form when data loads
  if (settings && !form.name && !form.currency) {
    setForm({ ...settings });
  }

  const updateMutation = useMutation({
    mutationFn: (data: GeneralSettings) => settingsService.updateGeneralSettings(data),
    onSuccess: (updatedSettings) => {
      queryClient.setQueryData(["settings"], updatedSettings);
      toast.success("Settings saved successfully");
    },
    onError: () => {
      toast.error("Failed to save settings");
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: (file: File) => settingsService.uploadLogo(file),
    onSuccess: (data) => {
      setForm(prev => ({ ...prev, logoUrl: data.logoUrl }));
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Logo uploaded successfully");
    },
    onError: () => {
      toast.error("Failed to upload logo");
    },
  });

  const uploadWelcomeImageMutation = useMutation({
    mutationFn: (file: File) => settingsService.uploadWelcomeImage(file),
    onSuccess: (data) => {
      setForm(prev => ({ ...prev, welcomeImageUrl: data.welcomeImageUrl }));
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Welcome image uploaded successfully");
    },
    onError: () => {
      toast.error("Failed to upload welcome image");
    },
  });

  const uploadHeroImageMutation = useMutation({
    mutationFn: (file: File) => settingsService.uploadHeroImage(file),
    onSuccess: (data) => {
      setForm(prev => ({ ...prev, heroImageUrl: data.heroImageUrl }));
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Hero image uploaded successfully");
    },
    onError: () => {
      toast.error("Failed to upload hero image");
    },
  });

  const uploadRoomsHeroImageMutation = useMutation({
    mutationFn: (file: File) => settingsService.uploadRoomsHeroImage(file),
    onSuccess: (data) => {
      setForm(prev => ({ ...prev, roomsHeroImageUrl: data.roomsHeroImageUrl }));
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Rooms hero image uploaded successfully");
    },
    onError: () => toast.error("Failed to upload Rooms hero image"),
  });

  const uploadDiningHeroImageMutation = useMutation({
    mutationFn: (file: File) => settingsService.uploadDiningHeroImage(file),
    onSuccess: (data) => {
      setForm(prev => ({ ...prev, diningHeroImageUrl: data.diningHeroImageUrl }));
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Dining hero image uploaded successfully");
    },
    onError: () => toast.error("Failed to upload Dining hero image"),
  });

  const uploadAboutHeroImageMutation = useMutation({
    mutationFn: (file: File) => settingsService.uploadAboutHeroImage(file),
    onSuccess: (data) => {
      setForm(prev => ({ ...prev, aboutHeroImageUrl: data.aboutHeroImageUrl }));
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("About hero image uploaded successfully");
    },
    onError: () => toast.error("Failed to upload About hero image"),
  });

  const uploadContactHeroImageMutation = useMutation({
    mutationFn: (file: File) => settingsService.uploadContactHeroImage(file),
    onSuccess: (data) => {
      setForm(prev => ({ ...prev, contactHeroImageUrl: data.contactHeroImageUrl }));
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Contact hero image uploaded successfully");
    },
    onError: () => toast.error("Failed to upload Contact hero image"),
  });

  const uploadGalleryHeroImageMutation = useMutation({
    mutationFn: (file: File) => settingsService.uploadGalleryHeroImage(file),
    onSuccess: (data) => {
      setForm(prev => ({ ...prev, galleryHeroImageUrl: data.galleryHeroImageUrl }));
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Gallery hero image uploaded successfully");
    },
    onError: () => toast.error("Failed to upload Gallery hero image"),
  });

  const createChefMutation = useMutation({
    mutationFn: (data: Chef) => chefService.createChef(data),
    onSuccess: () => {
      refetchChefs();
      setIsChefModalOpen(false);
      toast.success("Chef added successfully");
    },
    onError: () => toast.error("Failed to add chef"),
  });

  const updateChefMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Chef }) => chefService.updateChef(id, data),
    onSuccess: () => {
      refetchChefs();
      setIsChefModalOpen(false);
      toast.success("Chef updated successfully");
    },
    onError: () => toast.error("Failed to update chef"),
  });

  const deleteChefMutation = useMutation({
    mutationFn: (id: number) => chefService.deleteChef(id),
    onSuccess: () => {
      refetchChefs();
      toast.success("Chef deleted successfully");
    },
    onError: () => toast.error("Failed to delete chef"),
  });

  const chefPhotoUploadMutation = useMutation({
    mutationFn: (file: File) => chefService.uploadImage(file),
    onSuccess: (data) => {
      setChefFormImageUrl(data.imageUrl);
      toast.success("Chef photo uploaded successfully");
    },
    onError: () => {
      toast.error("Failed to upload chef photo");
    },
  });

  const handleSave = () => {
    if (!form.name || !form.address || !form.email || !form.phone) {
      toast.error("Please fill in all required fields (Name, Address, Email, Phone)");
      return;
    }
    updateMutation.mutate(form as GeneralSettings);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadLogoMutation.mutate(e.target.files[0]);
    }
  };

  const handleWelcomeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadWelcomeImageMutation.mutate(e.target.files[0]);
    }
  };

  const handleHeroFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadHeroImageMutation.mutate(e.target.files[0]);
    }
  };

  const handleRoomsHeroFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadRoomsHeroImageMutation.mutate(e.target.files[0]);
    }
  };

  const handleDiningHeroFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadDiningHeroImageMutation.mutate(e.target.files[0]);
    }
  };

  const handleAboutHeroFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadAboutHeroImageMutation.mutate(e.target.files[0]);
    }
  };

  const handleContactHeroFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadContactHeroImageMutation.mutate(e.target.files[0]);
    }
  };

  const handleGalleryHeroFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadGalleryHeroImageMutation.mutate(e.target.files[0]);
    }
  };

  const handleChefFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      chefPhotoUploadMutation.mutate(e.target.files[0]);
    }
  };

  return (
    <AppShell title="Settings" breadcrumbs={[{ label: "Home", to: "/dashboard" }, { label: "Settings" }]}>
      <Tabs defaultValue="general">
        <TabsList className="rounded-xl mb-4 flex-wrap h-auto">
          <TabsTrigger value="general" className="rounded-lg">General</TabsTrigger>
          <TabsTrigger value="policy" className="rounded-lg">Cancellation policy</TabsTrigger>

          <TabsTrigger value="roles" className="rounded-lg">Roles & permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 outline-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/20 backdrop-blur-sm border border-border/40 p-5 rounded-2xl">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-foreground flex items-center gap-2">
                General Settings
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Manage your property details, branding, taxes, and operations.</p>
            </div>
            <Button 
              disabled={updateMutation.isPending}
              onClick={handleSave}
              className="rounded-xl bg-gold text-gold-foreground hover:bg-gold/90 px-6 font-medium shadow-md flex items-center gap-2 shrink-0 self-start sm:self-auto transition-transform hover:scale-[1.02]"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="size-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>

          {isLoading ? (
            <div className="animate-pulse grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-6">
                <div className="h-[300px] bg-muted rounded-2xl"></div>
                <div className="h-[250px] bg-muted rounded-2xl"></div>
              </div>
              <div className="lg:col-span-4 space-y-6">
                <div className="h-[280px] bg-muted rounded-2xl"></div>
                <div className="h-[200px] bg-muted rounded-2xl"></div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column */}
              <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                {/* Card 1: Property Profile */}
                <Card className="p-6 rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm space-y-4 hover:border-primary/20 transition-all duration-300">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <Building2 className="size-4" />
                    </div>
                    <div>
                      <h3 className="font-serif text-base font-semibold">Property Profile</h3>
                      <p className="text-[11px] text-muted-foreground">Core details and contact information of your business.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Hotel / restaurant name</Label>
                      <Input 
                        value={form.name || ""} 
                        onChange={e => setForm(f => ({...f, name: e.target.value}))}
                        className="rounded-xl mt-1.5 bg-background/50 focus-visible:bg-background" 
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Phone</Label>
                        <Input 
                          value={form.phone || ""} 
                          onChange={e => setForm(f => ({...f, phone: e.target.value}))}
                          className="rounded-xl mt-1.5 bg-background/50 focus-visible:bg-background" 
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input 
                          value={form.email || ""} 
                          onChange={e => setForm(f => ({...f, email: e.target.value}))}
                          className="rounded-xl mt-1.5 bg-background/50 focus-visible:bg-background" 
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Address</Label>
                      <Textarea 
                        value={form.address || ""} 
                        onChange={e => setForm(f => ({...f, address: e.target.value}))}
                        className="rounded-xl mt-1.5 bg-background/50 focus-visible:bg-background min-h-[70px]" 
                      />
                    </div>

                    <div>
                      <Label>About us description (Multiline support)</Label>
                      <Textarea 
                        value={form.aboutText || ""} 
                        onChange={e => setForm(f => ({...f, aboutText: e.target.value}))}
                        className="rounded-xl mt-1.5 bg-background/50 focus-visible:bg-background min-h-[100px]" 
                        placeholder="Enter details of your hotel, history, and experience..."
                      />
                    </div>
                  </div>
                </Card>

                {/* Card 2: Facilities & Hours */}
                <Card className="p-6 rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm space-y-4 hover:border-primary/20 transition-all duration-300">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <Clock className="size-4" />
                    </div>
                    <div>
                      <h3 className="font-serif text-base font-semibold">Facilities & Operations</h3>
                      <p className="text-[11px] text-muted-foreground">Manage service hours and available amenities.</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <Label>Hotel Facilities / Amenities</Label>
                      <div className="flex gap-2 mt-1.5">
                        <Input 
                          value={newAmenity} 
                          onChange={e => setNewAmenity(e.target.value)} 
                          placeholder="e.g. WiFi, Pool, AC..." 
                          className="rounded-xl bg-background/50 focus-visible:bg-background"
                          onKeyDown={e => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              if (newAmenity.trim()) {
                                const current = form.hotelAmenities || [];
                                if (!current.includes(newAmenity.trim())) {
                                  setForm(f => ({ ...f, hotelAmenities: [...current, newAmenity.trim()] }));
                                }
                                setNewAmenity("");
                              }
                            }
                          }}
                        />
                        <Button 
                          type="button" 
                          onClick={() => {
                            if (newAmenity.trim()) {
                              const current = form.hotelAmenities || [];
                              if (!current.includes(newAmenity.trim())) {
                                setForm(f => ({ ...f, hotelAmenities: [...current, newAmenity.trim()] }));
                              }
                              setNewAmenity("");
                            }
                          }}
                          className="rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        >
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {(form.hotelAmenities || []).map((amenity) => (
                          <span 
                            key={amenity} 
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20"
                          >
                            {amenity}
                            <button 
                              type="button" 
                              onClick={() => setForm(f => ({ ...f, hotelAmenities: (f.hotelAmenities || []).filter(a => a !== amenity) }))}
                              className="hover:text-destructive transition-colors ml-1"
                            >
                              <X className="size-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Opening / Dining Hours</Label>
                      <div className="flex flex-col gap-2.5 mt-1.5 p-4 rounded-xl border border-border/40 bg-muted/20">
                        <div className="flex gap-4 items-center justify-between">
                          <Input 
                            value={newHourName} 
                            onChange={e => setNewHourName(e.target.value)} 
                            placeholder="e.g. Reception, Breakfast..." 
                            className="rounded-xl flex-1 bg-background/50 focus-visible:bg-background"
                          />
                          <div className="flex items-center gap-2 shrink-0 select-none">
                            <Checkbox 
                              id="is24h-picker" 
                              checked={is24Hours} 
                              onCheckedChange={(checked: boolean) => setIs24Hours(!!checked)} 
                            />
                            <label 
                              htmlFor="is24h-picker" 
                              className="text-xs text-muted-foreground cursor-pointer font-medium whitespace-nowrap"
                            >
                              Open 24 Hours
                            </label>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 flex items-center gap-2">
                            {is24Hours ? (
                              <Input 
                                disabled 
                                value="24 hours" 
                                className="rounded-xl cursor-not-allowed bg-muted/50 w-full" 
                              />
                            ) : (
                              <div className="flex items-center gap-2 w-full">
                                <Input 
                                  type="time" 
                                  value={timeFrom} 
                                  onChange={e => setTimeFrom(e.target.value)} 
                                  className="rounded-xl w-full bg-background/50 focus-visible:bg-background" 
                                />
                                <span className="text-xs text-muted-foreground shrink-0">to</span>
                                <Input 
                                  type="time" 
                                  value={timeTo} 
                                  onChange={e => setTimeTo(e.target.value)} 
                                  className="rounded-xl w-full bg-background/50 focus-visible:bg-background" 
                                />
                              </div>
                            )}
                          </div>
                          <Button 
                            type="button" 
                            onClick={() => {
                              if (newHourName.trim()) {
                                const timeVal = is24Hours ? "24 hours" : `${timeFrom} - ${timeTo}`;
                                const current = form.hotelHours || [];
                                const newItem = `${newHourName.trim()}|${timeVal}`;
                                if (!current.includes(newItem)) {
                                  setForm(f => ({ ...f, hotelHours: [...current, newItem] }));
                                }
                                setNewHourName("");
                                setIs24Hours(false);
                              }
                            }}
                            className="rounded-xl shrink-0 bg-secondary text-secondary-foreground hover:bg-secondary/80"
                          >
                            Add Slot
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2 mt-3">
                        {(form.hotelHours || []).map((hourStr, idx) => {
                          const parts = hourStr.split('|');
                          const name = parts[0] || "";
                          const val = parts[1] || "";
                          return (
                            <div key={idx} className="flex justify-between items-center bg-muted/20 px-4 py-2 rounded-xl border border-border/40 text-sm">
                              <span><strong>{name}</strong>: {val}</span>
                              <button 
                                type="button" 
                                onClick={() => setForm(f => ({ ...f, hotelHours: (f.hotelHours || []).filter((_, i) => i !== idx) }))}
                                className="text-muted-foreground hover:text-destructive transition-colors p-1"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Gallery Management Card */}
                <Card className="p-6 rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm space-y-4 hover:border-primary/20 transition-all duration-300">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <ImageIcon className="size-4" />
                    </div>
                    <div>
                      <h3 className="font-serif text-base font-semibold">Gallery Management</h3>
                      <p className="text-[11px] text-muted-foreground">Add and manage photos shown on the guest gallery page.</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-12 gap-6">
                    {/* Add Photo Form */}
                    <div className="md:col-span-4 space-y-3.5 md:border-r md:border-border/40 md:pr-6">
                      <Label className="text-xs uppercase tracking-wider font-semibold">Add New Photo</Label>
                      
                      <div className="space-y-1">
                        <Label htmlFor="gallery-file" className="text-xs text-muted-foreground">Select Image</Label>
                        <Input 
                          id="gallery-file"
                          type="file" 
                          accept="image/*" 
                          onChange={e => setGalleryFile(e.target.files?.[0] || null)}
                          className="rounded-xl bg-background/50 focus-visible:bg-background text-xs cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="gallery-desc" className="text-xs text-muted-foreground">Description</Label>
                        <Textarea 
                          id="gallery-desc"
                          value={galleryDesc} 
                          onChange={e => setGalleryDesc(e.target.value)} 
                          placeholder="Cozy fireplace, ocean view suite, etc..." 
                          className="rounded-xl bg-background/50 focus-visible:bg-background text-xs h-20"
                        />
                      </div>

                      <Button 
                        onClick={() => createGalleryMutation.mutate({ desc: galleryDesc, file: galleryFile })} 
                        disabled={!galleryFile || createGalleryMutation.isPending} 
                        className="w-full rounded-xl bg-gold text-gold-foreground hover:bg-gold/90 font-semibold text-xs"
                      >
                        {createGalleryMutation.isPending ? (
                          <>
                            <Loader2 className="size-3 animate-spin mr-1.5" />
                            Uploading...
                          </>
                        ) : "Upload to Gallery"}
                      </Button>
                    </div>

                    {/* Existing Gallery Photos */}
                    <div className="md:col-span-8 space-y-3.5">
                      <Label className="text-xs uppercase tracking-wider font-semibold">Uploaded Photos ({galleryItems.length})</Label>
                      
                      {galleryItems.length === 0 ? (
                        <div className="h-40 rounded-xl border border-dashed border-border/60 flex items-center justify-center text-xs text-muted-foreground bg-background/20">
                          No images uploaded yet.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-1">
                          {galleryItems.map((item) => (
                            <Card key={item.id} className="overflow-hidden group relative border border-border/40 bg-background/40">
                              {item.imageUrl ? (
                                <img 
                                  src={item.imageUrl.startsWith('http') ? item.imageUrl : (item.imageUrl.includes('/attachments') ? getImageUrl(item.imageUrl) : getImageUrl(`/attachments/gallery/${item.imageUrl}`))} 
                                  alt={item.description || "Gallery"} 
                                  className="w-full h-24 object-cover" 
                                />
                              ) : (
                                <div className="w-full h-24 bg-muted flex items-center justify-center text-[10px]">No Image</div>
                              )}
                              <div className="p-2 text-[10px] truncate" title={item.description || ""}>
                                {item.description || <span className="text-muted-foreground italic">No description</span>}
                              </div>
                              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                  size="icon" 
                                  variant="destructive" 
                                  className="h-6 w-6 rounded-md" 
                                  onClick={() => {
                                    if(confirm("Delete this photo?")) deleteGalleryMutation.mutate(item.id!);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-5 xl:col-span-4 space-y-6">
                {/* Card 3: Brand Identity */}
                <Card className="p-6 rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm space-y-4 hover:border-primary/20 transition-all duration-300">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <ImageIcon className="size-4" />
                    </div>
                    <div>
                      <h3 className="font-serif text-base font-semibold">Brand Identity</h3>
                      <p className="text-[11px] text-muted-foreground">Property branding logo, color, and welcome visual.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Logo</Label>
                      <div 
                        className="mt-1.5 h-24 rounded-xl border-2 border-dashed border-border/65 flex flex-col items-center justify-center text-xs gap-2 text-muted-foreground cursor-pointer hover:bg-muted/30 transition-all overflow-hidden relative group"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {form.logoUrl ? (
                          <>
                            <img src={getImageUrl(form.logoUrl)} alt="Logo" className="h-full object-contain p-2" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[10px] text-white bg-black/60 px-2 py-1 rounded-md">Change Logo</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <Upload className="size-4 text-muted-foreground/80 group-hover:scale-110 transition-transform" /> 
                            <span>{uploadLogoMutation.isPending ? "Uploading..." : "Upload Logo"}</span>
                          </>
                        )}
                      </div>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>

                    <div>
                      <Label>Logo Background Color</Label>
                      <div className="flex gap-2 items-center mt-1.5">
                        <Input 
                          type="color" 
                          value={form.logoBackgroundColor || "#070e17"} 
                          onChange={e => setForm(f => ({...f, logoBackgroundColor: e.target.value}))}
                          className="size-10 p-1 rounded-xl cursor-pointer shrink-0 border-0 bg-transparent" 
                        />
                        <Input 
                          type="text" 
                          value={form.logoBackgroundColor || "#070e17"} 
                          onChange={e => setForm(f => ({...f, logoBackgroundColor: e.target.value}))}
                          placeholder="#070e17"
                          className="rounded-xl font-mono uppercase bg-background/50 focus-visible:bg-background" 
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Welcome Section Background Image</Label>
                      <div 
                        className="mt-1.5 h-24 rounded-xl border-2 border-dashed border-border/65 flex flex-col items-center justify-center text-xs gap-2 text-muted-foreground cursor-pointer hover:bg-muted/30 transition-all overflow-hidden relative group"
                        onClick={() => welcomeImageRef.current?.click()}
                      >
                        {form.welcomeImageUrl ? (
                          <>
                            <img src={getImageUrl(form.welcomeImageUrl)} alt="Welcome Image" className="h-full object-cover w-full" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[10px] text-white bg-black/60 px-2 py-1 rounded-md">Change Image</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <Upload className="size-4 text-muted-foreground/80 group-hover:scale-110 transition-transform" /> 
                            <span>{uploadWelcomeImageMutation.isPending ? "Uploading..." : "Upload Welcome Image"}</span>
                          </>
                        )}
                      </div>
                      <input type="file" ref={welcomeImageRef} className="hidden" accept="image/*" onChange={handleWelcomeFileChange} />
                    </div>
                  </div>
                </Card>

                {/* Page Hero Images Card */}
                <Card className="p-6 rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm space-y-4 hover:border-primary/20 transition-all duration-300">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <ImageIcon className="size-4" />
                    </div>
                    <div>
                      <h3 className="font-serif text-base font-semibold">Page Hero Images</h3>
                      <p className="text-[11px] text-muted-foreground">Configure background header images for each website page.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Home Hero */}
                    <div>
                      <Label className="text-xs">Home Page Hero</Label>
                      <div 
                        className="mt-1.5 h-20 rounded-xl border-2 border-dashed border-border/65 flex flex-col items-center justify-center text-[10px] gap-1 text-muted-foreground cursor-pointer hover:bg-muted/30 transition-all overflow-hidden relative group"
                        onClick={() => heroImageRef.current?.click()}
                      >
                        {form.heroImageUrl ? (
                          <>
                            <img src={getImageUrl(form.heroImageUrl)} alt="Home Hero" className="h-full object-cover w-full" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[9px] text-white bg-black/60 px-1.5 py-0.5 rounded">Change</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <Upload className="size-3.5 text-muted-foreground/80 group-hover:scale-110 transition-transform" /> 
                            <span>{uploadHeroImageMutation.isPending ? "Uploading..." : "Upload"}</span>
                          </>
                        )}
                      </div>
                      <input type="file" ref={heroImageRef} className="hidden" accept="image/*" onChange={handleHeroFileChange} />
                    </div>

                    {/* Rooms Hero */}
                    <div>
                      <Label className="text-xs">Rooms Page Hero</Label>
                      <div 
                        className="mt-1.5 h-20 rounded-xl border-2 border-dashed border-border/65 flex flex-col items-center justify-center text-[10px] gap-1 text-muted-foreground cursor-pointer hover:bg-muted/30 transition-all overflow-hidden relative group"
                        onClick={() => roomsHeroImageRef.current?.click()}
                      >
                        {form.roomsHeroImageUrl ? (
                          <>
                            <img src={getImageUrl(form.roomsHeroImageUrl)} alt="Rooms Hero" className="h-full object-cover w-full" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[9px] text-white bg-black/60 px-1.5 py-0.5 rounded">Change</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <Upload className="size-3.5 text-muted-foreground/80 group-hover:scale-110 transition-transform" /> 
                            <span>{uploadRoomsHeroImageMutation.isPending ? "Uploading..." : "Upload"}</span>
                          </>
                        )}
                      </div>
                      <input type="file" ref={roomsHeroImageRef} className="hidden" accept="image/*" onChange={handleRoomsHeroFileChange} />
                    </div>

                    {/* Dining Hero */}
                    <div>
                      <Label className="text-xs">Dining Page Hero</Label>
                      <div 
                        className="mt-1.5 h-20 rounded-xl border-2 border-dashed border-border/65 flex flex-col items-center justify-center text-[10px] gap-1 text-muted-foreground cursor-pointer hover:bg-muted/30 transition-all overflow-hidden relative group"
                        onClick={() => diningHeroImageRef.current?.click()}
                      >
                        {form.diningHeroImageUrl ? (
                          <>
                            <img src={getImageUrl(form.diningHeroImageUrl)} alt="Dining Hero" className="h-full object-cover w-full" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[9px] text-white bg-black/60 px-1.5 py-0.5 rounded">Change</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <Upload className="size-3.5 text-muted-foreground/80 group-hover:scale-110 transition-transform" /> 
                            <span>{uploadDiningHeroImageMutation.isPending ? "Uploading..." : "Upload"}</span>
                          </>
                        )}
                      </div>
                      <input type="file" ref={diningHeroImageRef} className="hidden" accept="image/*" onChange={handleDiningHeroFileChange} />
                    </div>

                    {/* About Hero */}
                    <div>
                      <Label className="text-xs">About Page Hero</Label>
                      <div 
                        className="mt-1.5 h-20 rounded-xl border-2 border-dashed border-border/65 flex flex-col items-center justify-center text-[10px] gap-1 text-muted-foreground cursor-pointer hover:bg-muted/30 transition-all overflow-hidden relative group"
                        onClick={() => aboutHeroImageRef.current?.click()}
                      >
                        {form.aboutHeroImageUrl ? (
                          <>
                            <img src={getImageUrl(form.aboutHeroImageUrl)} alt="About Hero" className="h-full object-cover w-full" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[9px] text-white bg-black/60 px-1.5 py-0.5 rounded">Change</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <Upload className="size-3.5 text-muted-foreground/80 group-hover:scale-110 transition-transform" /> 
                            <span>{uploadAboutHeroImageMutation.isPending ? "Uploading..." : "Upload"}</span>
                          </>
                        )}
                      </div>
                      <input type="file" ref={aboutHeroImageRef} className="hidden" accept="image/*" onChange={handleAboutHeroFileChange} />
                    </div>

                    {/* Contact Hero */}
                    <div>
                      <Label className="text-xs">Contact Page Hero</Label>
                      <div 
                        className="mt-1.5 h-20 rounded-xl border-2 border-dashed border-border/65 flex flex-col items-center justify-center text-[10px] gap-1 text-muted-foreground cursor-pointer hover:bg-muted/30 transition-all overflow-hidden relative group"
                        onClick={() => contactHeroImageRef.current?.click()}
                      >
                        {form.contactHeroImageUrl ? (
                          <>
                            <img src={getImageUrl(form.contactHeroImageUrl)} alt="Contact Hero" className="h-full object-cover w-full" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[9px] text-white bg-black/60 px-1.5 py-0.5 rounded">Change</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <Upload className="size-3.5 text-muted-foreground/80 group-hover:scale-110 transition-transform" /> 
                            <span>{uploadContactHeroImageMutation.isPending ? "Uploading..." : "Upload"}</span>
                          </>
                        )}
                      </div>
                      <input type="file" ref={contactHeroImageRef} className="hidden" accept="image/*" onChange={handleContactHeroFileChange} />
                    </div>

                    {/* Gallery Hero */}
                    <div>
                      <Label className="text-xs">Gallery Page Hero</Label>
                      <div 
                        className="mt-1.5 h-20 rounded-xl border-2 border-dashed border-border/65 flex flex-col items-center justify-center text-[10px] gap-1 text-muted-foreground cursor-pointer hover:bg-muted/30 transition-all overflow-hidden relative group"
                        onClick={() => galleryHeroImageRef.current?.click()}
                      >
                        {form.galleryHeroImageUrl ? (
                          <>
                            <img src={getImageUrl(form.galleryHeroImageUrl)} alt="Gallery Hero" className="h-full object-cover w-full" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[9px] text-white bg-black/60 px-1.5 py-0.5 rounded">Change</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <Upload className="size-3.5 text-muted-foreground/80 group-hover:scale-110 transition-transform" /> 
                            <span>{uploadGalleryHeroImageMutation.isPending ? "Uploading..." : "Upload"}</span>
                          </>
                        )}
                      </div>
                      <input type="file" ref={galleryHeroImageRef} className="hidden" accept="image/*" onChange={handleGalleryHeroFileChange} />
                    </div>
                  </div>
                </Card>

                {/* Card 4: Taxes & Financials */}
                <Card className="p-6 rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm space-y-4 hover:border-primary/20 transition-all duration-300">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <Coins className="size-4" />
                    </div>
                    <div>
                      <h3 className="font-serif text-base font-semibold">Taxes & Currency</h3>
                      <p className="text-[11px] text-muted-foreground">Currency configuration and default tax rates.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Currency</Label>
                        <Select 
                          value={form.currency || "INR (₹)"} 
                          onValueChange={(val) => setForm(prev => ({ ...prev, currency: val }))}
                        >
                          <SelectTrigger className="rounded-xl mt-1.5 bg-background/50">
                            <SelectValue placeholder="Select Currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INR (₹)">INR (₹)</SelectItem>
                            <SelectItem value="USD ($)">USD ($)</SelectItem>
                            <SelectItem value="EUR (€)">EUR (€)</SelectItem>
                            <SelectItem value="GBP (£)">GBP (£)</SelectItem>
                            <SelectItem value="AED (د.إ)">AED (د.إ)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Service charge %</Label>
                        <Input 
                          type="number"
                          value={form.serviceChargePercent ?? 10} 
                          onChange={(e) => setForm(prev => ({ ...prev, serviceChargePercent: parseFloat(e.target.value) || 0 }))}
                          className="rounded-xl mt-1.5 bg-background/50 focus-visible:bg-background" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>CGST %</Label>
                        <Input 
                          type="number"
                          value={form.cgstPercent ?? 9} 
                          onChange={(e) => setForm(prev => ({ ...prev, cgstPercent: parseFloat(e.target.value) || 0 }))}
                          className="rounded-xl mt-1.5 bg-background/50 focus-visible:bg-background" 
                        />
                      </div>
                      <div>
                        <Label>SGST %</Label>
                        <Input 
                          type="number"
                          value={form.sgstPercent ?? 9} 
                          onChange={(e) => setForm(prev => ({ ...prev, sgstPercent: parseFloat(e.target.value) || 0 }))}
                          className="rounded-xl mt-1.5 bg-background/50 focus-visible:bg-background" 
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Extra bed rate (per night)</Label>
                      <Input 
                        type="number"
                        value={form.extraBedPrice ?? 500} 
                        onChange={(e) => setForm(prev => ({ ...prev, extraBedPrice: parseFloat(e.target.value) || 0 }))}
                        className="rounded-xl mt-1.5 bg-background/50 focus-visible:bg-background" 
                        placeholder="500"
                      />
                    </div>
                  </div>
                </Card>

                {/* Card 5: Waitlist Settings */}
                <Card className="p-6 rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm space-y-4 hover:border-primary/20 transition-all duration-300">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <Sliders className="size-4" />
                    </div>
                    <div>
                      <h3 className="font-serif text-base font-semibold">Waitlist Settings</h3>
                      <p className="text-[11px] text-muted-foreground">Dining wait times and advance bookings configuration.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Wait time (min)</Label>
                        <Input 
                          type="number"
                          value={form.waitlistEstimatedWaitMinutes ?? 22} 
                          onChange={(e) => setForm(prev => ({ ...prev, waitlistEstimatedWaitMinutes: parseInt(e.target.value) || 0 }))}
                          className="rounded-xl mt-1.5 bg-background/50 focus-visible:bg-background" 
                        />
                      </div>
                      <div>
                        <Label>Min booking (%)</Label>
                        <Input 
                          type="number"
                          min={0}
                          max={100}
                          value={form.minimumAdvancePercent ?? 0} 
                          onChange={(e) => setForm(prev => ({ ...prev, minimumAdvancePercent: parseFloat(e.target.value) || 0 }))}
                          className="rounded-xl mt-1.5 bg-background/50 focus-visible:bg-background" 
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Waitlist descriptive message</Label>
                      <Textarea 
                        value={form.waitlistMessage ?? "Based on average turnover of 48m over the last hour and 3 free tables."} 
                        onChange={(e) => setForm(prev => ({ ...prev, waitlistMessage: e.target.value }))}
                        className="rounded-xl mt-1.5 bg-background/50 focus-visible:bg-background min-h-[60px]" 
                      />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Card 6: Culinary Team Directory (Full Width at the bottom) */}
              <div className="lg:col-span-12 mt-2">
                <Card className="p-6 rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm space-y-5 hover:border-primary/20 transition-all duration-300">
                  <div className="flex items-center justify-between pb-2 border-b border-border/40">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-gold/10 text-gold">
                        <Users className="size-4" />
                      </div>
                      <div>
                        <h3 className="font-serif text-lg font-semibold text-gold">Chef Team Directory</h3>
                        <p className="text-xs text-muted-foreground">Manage the chefs shown on the About page of your hotel.</p>
                      </div>
                    </div>
                    <Button 
                      type="button"
                      onClick={() => {
                        setSelectedChef(null);
                        setChefFormName("");
                        setChefFormRole("");
                        setChefFormDescription("");
                        setChefFormImageUrl("");
                        setIsChefModalOpen(true);
                      }} 
                      size="sm" 
                      className="rounded-xl flex items-center gap-1 bg-gold text-gold-foreground hover:bg-gold/90 transition-all hover:scale-105"
                    >
                      <Plus className="size-4" /> Add Chef
                    </Button>
                  </div>

                  {chefs.length === 0 ? (
                    <div className="border border-dashed border-border/60 rounded-xl p-8 text-center text-sm text-muted-foreground bg-muted/5">
                      No chefs added yet. Click "Add Chef" to build your culinary team.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {chefs.map((c: Chef) => (
                        <div key={c.id} className="flex gap-3 p-3.5 border border-border/40 rounded-xl items-start relative bg-card/40 text-card-foreground hover:border-primary/20 transition-all group">
                          {c.imageUrl ? (
                            <img src={getImageUrl(c.imageUrl)} alt={c.name} className="size-16 rounded-lg object-cover border border-border/40" />
                          ) : (
                            <div className="size-16 rounded-lg bg-muted/40 flex items-center justify-center text-[10px] text-muted-foreground border border-border/40">No Photo</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate text-sm">{c.name}</div>
                            {c.role && <div className="text-xs text-gold font-medium truncate mt-0.5">{c.role}</div>}
                            {c.description && <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">{c.description}</p>}
                          </div>
                          <div className="flex gap-1 shrink-0 ml-2">
                            <Button 
                              type="button"
                              onClick={() => {
                                setSelectedChef(c);
                                setChefFormName(c.name);
                                setChefFormRole(c.role || "");
                                setChefFormDescription(c.description || "");
                                setChefFormImageUrl(c.imageUrl || "");
                                setIsChefModalOpen(true);
                              }} 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                            >
                              Edit
                            </Button>
                            <Button 
                              type="button"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete Chef ${c.name}?`)) {
                                  deleteChefMutation.mutate(c.id!);
                                }
                              }} 
                              variant="ghost" 
                              size="icon" 
                              className="size-7 rounded-lg text-destructive hover:text-destructive/90"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="policy">
          <Card className="p-6 rounded-2xl">
            <div className="font-serif text-lg mb-2">Cancellation tiers</div>
            <p className="text-sm text-muted-foreground mb-4">These rules appear in the Bookings cancellation flow.</p>
            <div className="grid md:grid-cols-3 gap-3">
              <Card className="p-4 rounded-xl border-success/40 bg-success/5">
                <div className="text-xs text-muted-foreground">7+ days before check-in</div>
                <div className="mt-2 flex items-center gap-2">
                  <Input 
                    type="number" 
                    min={0} 
                    max={100} 
                    value={form.cancellation7DaysRefundPercent ?? 100} 
                    onChange={e => setForm({ ...form, cancellation7DaysRefundPercent: parseFloat(e.target.value) || 0 })} 
                    className="w-24 rounded-lg" 
                  />
                  <span className="text-sm text-muted-foreground">% refunded</span>
                </div>
              </Card>

              <Card className="p-4 rounded-xl border-warning/40 bg-warning/5">
                <div className="text-xs text-muted-foreground">3–6 days before</div>
                <div className="mt-2 flex items-center gap-2">
                  <Input 
                    type="number" 
                    min={0} 
                    max={100} 
                    value={form.cancellation3To6DaysRefundPercent ?? 50} 
                    onChange={e => setForm({ ...form, cancellation3To6DaysRefundPercent: parseFloat(e.target.value) || 0 })} 
                    className="w-24 rounded-lg" 
                  />
                  <span className="text-sm text-muted-foreground">% refunded</span>
                </div>
              </Card>

              <Card className="p-4 rounded-xl border-destructive/40 bg-destructive/5">
                <div className="text-xs text-muted-foreground">Within 48 hrs</div>
                <div className="mt-2 flex items-center gap-2">
                  <Input 
                    type="number" 
                    min={0} 
                    max={100} 
                    value={form.cancellationWithin48HoursRefundPercent ?? 0} 
                    onChange={e => setForm({ ...form, cancellationWithin48HoursRefundPercent: parseFloat(e.target.value) || 0 })} 
                    className="w-24 rounded-lg" 
                  />
                  <span className="text-sm text-muted-foreground">% refunded</span>
                </div>
              </Card>
            </div>
            <div className="mt-6">
              <Button 
                disabled={updateMutation.isPending} 
                className="rounded-xl bg-primary text-primary-foreground" 
                onClick={handleSave}
              >
                {updateMutation.isPending ? "Saving..." : "Save policy"}
              </Button>
            </div>
          </Card>
        </TabsContent>


        <TabsContent value="roles">
          <div className="grid md:grid-cols-[250px_1fr] gap-6 items-start">
            {/* Left sidebar: list of roles */}
            <Card className="p-4 rounded-2xl border border-border/40 bg-sidebar/20 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-foreground">Roles</span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="size-8 p-0 rounded-lg"
                  onClick={() => setIsAddRoleOpen(true)}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
              <div className="space-y-1">
                {roles.map((r) => (
                  <div
                    key={r.name}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all ${
                      selectedRole.toLowerCase() === r.name.toLowerCase()
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setSelectedRole(r.name)}
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="size-4" />
                      <span>{r.name}</span>
                    </div>
                    {!r.isSystem && (
                      <button
                        className={`size-6 rounded-md flex items-center justify-center transition-colors ${
                          selectedRole.toLowerCase() === r.name.toLowerCase()
                            ? "hover:bg-primary-foreground/15 text-primary-foreground"
                            : "hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Are you sure you want to delete the role "${r.name}"?`)) {
                            permissionService.deleteRole(r.name).then(() => {
                              refetchRoles();
                              if (selectedRole === r.name) {
                                setSelectedRole("Admin");
                              }
                              toast.success(`Role "${r.name}" deleted successfully.`);
                            }).catch(() => {
                              toast.error(`Failed to delete role "${r.name}".`);
                            });
                          }
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                    {r.isSystem && <Lock className="size-3.5 opacity-40" />}
                  </div>
                ))}
              </div>
            </Card>

            {/* Right panel: permissions matrix */}
            <Card className="p-6 rounded-2xl border border-border/40 bg-sidebar/20 space-y-6">
              <div>
                <h3 className="font-serif text-xl font-bold flex items-center gap-2">
                  <Shield className="size-5 text-primary" />
                  Permissions for {selectedRole}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Configure module access and dynamic actions for this user role.</p>
              </div>

              {editingPermissions && (
                <div className="space-y-4">
                  {Object.entries({
                    dashboard: { label: "Dashboard" },
                    rooms: {
                      label: "Rooms",
                      sub: [
                        { key: "add", label: "Add Room" },
                        { key: "edit", label: "Edit Room Status/Details" },
                        { key: "delete", label: "Delete Room" }
                      ]
                    },
                    bookings: {
                      label: "Bookings",
                      sub: [
                        { key: "add", label: "Create Booking" },
                        { key: "edit", label: "Modify booking" },
                        { key: "delete", label: "Cancel booking" }
                      ]
                    },
                    tables: {
                      label: "Restaurant Tables",
                      sub: [
                        { key: "add", label: "Add Table / Manage Zones" },
                        { key: "edit", label: "Merge / Edit Table Status" },
                        { key: "delete", label: "Delete Table" }
                      ]
                    },
                    waitlist: {
                      label: "Waiting List",
                      sub: [
                        { key: "add", label: "Add to Waitlist" },
                        { key: "edit", label: "Update Status" },
                        { key: "delete", label: "Remove from Waitlist" }
                      ]
                    },
                    orders: {
                      label: "Restaurant Orders",
                      sub: [
                        { key: "add", label: "Create Order" },
                        { key: "edit", label: "Modify Order / Status" },
                        { key: "delete", label: "Cancel Order" },
                        { key: "waiterSide", label: "Access Waiter Side (POS Menu)" },
                        { key: "kitchenSide", label: "Access Kitchen Side (KDS Board)" }
                      ]
                    },
                    menu: {
                      label: "Restaurant Menu",
                      sub: [
                        { key: "add", label: "Add Menu Item" },
                        { key: "edit", label: "Edit Item Details / Price" },
                        { key: "delete", label: "Remove Menu Item" }
                      ]
                    },
                    billing: {
                      label: "Billing & Invoicing",
                      sub: [
                        { key: "add", label: "Generate Bills" },
                        { key: "edit", label: "Apply Discount / Modify Payment" },
                        { key: "delete", label: "Void Bill" }
                      ]
                    },
                    employees: {
                      label: "Employees (Directory)",
                      sub: [
                        { key: "add", label: "Add Employee" },
                        { key: "edit", label: "Edit Role / Profile" },
                        { key: "delete", label: "Terminate Employee" }
                      ]
                    },
                    settings: {
                      label: "System Settings",
                      sub: [
                        { key: "edit", label: "Configure Brand, Taxes & Tiers" }
                      ]
                    }
                  } as Record<string, { label: string; sub?: { key: string; label: string }[] }>).map(([moduleKey, config]) => {
                    const modulePerm = editingPermissions[moduleKey as keyof RolePermissions] || { access: false };
                    
                    return (
                      <div key={moduleKey} className="border border-border/40 rounded-xl p-4 bg-background/40 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm">{config.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{modulePerm.access ? "Enabled" : "Disabled"}</span>
                            <Switch
                              checked={modulePerm.access}
                              onCheckedChange={(checked) => {
                                setEditingPermissions(prev => {
                                  if (!prev) return null;
                                  const updated = { ...prev };
                                  updated[moduleKey as keyof RolePermissions] = {
                                    ...updated[moduleKey as keyof RolePermissions],
                                    access: checked
                                  };
                                  return updated;
                                });
                              }}
                            />
                          </div>
                        </div>

                        {/* Expandable sub-permissions */}
                        {modulePerm.access && config.sub && config.sub.length > 0 && (
                          <div className="pt-3 border-t border-dashed border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-200">
                            {config.sub.map((subItem) => {
                              const checked = !!(modulePerm as any)[subItem.key];
                              return (
                                <label key={subItem.key} className="flex items-center gap-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      const isChecked = e.target.checked;
                                      setEditingPermissions(prev => {
                                        if (!prev) return null;
                                        const updated = { ...prev };
                                        updated[moduleKey as keyof RolePermissions] = {
                                          ...updated[moduleKey as keyof RolePermissions],
                                          [subItem.key]: isChecked
                                        };
                                        return updated;
                                      });
                                    }}
                                    className="rounded border-border text-primary focus:ring-primary size-4"
                                  />
                                  {subItem.label}
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="pt-4 border-t border-border/60 flex justify-end">
                    <Button
                      className="rounded-xl bg-primary text-primary-foreground font-semibold px-6"
                      onClick={() => {
                        if (!editingPermissions) return;
                        permissionService.saveRolePermissions(selectedRole, editingPermissions).then(() => {
                          refetchRoles();
                          toast.success(`Permissions for "${selectedRole}" saved successfully!`);
                        }).catch(() => {
                          toast.error(`Failed to save permissions for "${selectedRole}".`);
                        });
                      }}
                    >
                      Save Permissions
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Role Dialog */}
      <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Create New Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 my-4">
            <div className="space-y-1.5">
              <Label htmlFor="roleName">Role Name</Label>
              <Input
                id="roleName"
                placeholder="e.g. Receptionist, Cashier"
                value={newRoleName}
                onChange={e => setNewRoleName(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setIsAddRoleOpen(false)}>Cancel</Button>
            <Button
              className="rounded-xl bg-primary text-primary-foreground"
              onClick={() => {
                const name = newRoleName.trim();
                if (!name) {
                  return toast.error("Role name cannot be empty.");
                }
                if (roles.some(r => r.name.toLowerCase() === name.toLowerCase())) {
                  return toast.error("A role with this name already exists.");
                }

                // Copy admin permissions as a baseline starting point
                const adminPerms = roles.find(r => r.name === "Admin")?.permissions || roles[0]?.permissions;
                
                permissionService.saveRolePermissions(name, adminPerms).then(() => {
                  refetchRoles();
                  setSelectedRole(name);
                  setIsAddRoleOpen(false);
                  setNewRoleName("");
                  toast.success(`Role "${name}" created successfully!`);
                }).catch(() => {
                  toast.error(`Failed to create role "${name}".`);
                });
              }}
            >
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chef Modal */}
      <Dialog open={isChefModalOpen} onOpenChange={setIsChefModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              {selectedChef ? "Edit Chef Profile" : "Add Chef"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 my-4">
            <div className="space-y-1.5">
              <Label htmlFor="chefName">Chef Name</Label>
              <Input
                id="chefName"
                placeholder="e.g. Aditi Rao"
                value={chefFormName}
                onChange={e => setChefFormName(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="chefPhoto">Chef Photo</Label>
              <div 
                className="mt-1 h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-xs gap-1 text-muted-foreground cursor-pointer hover:bg-muted/50 overflow-hidden relative"
                onClick={() => chefImageRef.current?.click()}
              >
                {chefFormImageUrl ? (
                  <img src={getImageUrl(chefFormImageUrl)} alt="Chef Photo" className="h-full object-cover w-full" />
                ) : (
                  <>
                    <Upload className="size-4" /> 
                    {chefPhotoUploadMutation.isPending ? "Uploading..." : "Upload Chef Photo"}
                  </>
                )}
              </div>
              <input type="file" ref={chefImageRef} className="hidden" accept="image/*" onChange={handleChefFileChange} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="chefDescription">Bio / Description</Label>
              <Textarea
                id="chefDescription"
                placeholder="Chef details..."
                value={chefFormDescription}
                onChange={e => setChefFormDescription(e.target.value)}
                className="rounded-xl min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setIsChefModalOpen(false)}>Cancel</Button>
            <Button
              className="rounded-xl bg-gold text-gold-foreground hover:bg-gold/90"
              onClick={() => {
                if (!chefFormName.trim()) {
                  return toast.error("Chef name cannot be empty.");
                }
                const data: Chef = {
                  name: chefFormName,
                  role: chefFormRole || null,
                  description: chefFormDescription || null,
                  imageUrl: chefFormImageUrl || null,
                };
                if (selectedChef) {
                  updateChefMutation.mutate({ id: selectedChef.id!, data: { ...selectedChef, ...data } });
                } else {
                  createChefMutation.mutate(data);
                }
              }}
              disabled={createChefMutation.isPending || updateChefMutation.isPending}
            >
              {selectedChef ? "Update Profile" : "Add Chef"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
