"use client";

import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { LoadingCard } from "@/components/ui/loading-card";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Edit, Trash2 } from "lucide-react";

interface SuspensionSettings {
  id?: string;
  fork_compression: number | null;
  fork_rebound: number | null;
  shock_high_speed_compression: number | null;
  shock_low_speed_compression: number | null;
  shock_rebound: number | null;
  shock_sag: number | null;
  notes: string;
  created_at?: string;
}

export default function SuspensionPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SuspensionSettings>({
    fork_compression: null,
    fork_rebound: null,
    shock_high_speed_compression: null,
    shock_low_speed_compression: null,
    shock_rebound: null,
    shock_sag: null,
    notes: "",
  });
  const [savedSettings, setSavedSettings] = useState<SuspensionSettings[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      setIsLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from("suspension_settings")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching suspension settings:", error);
        return;
      }

      setSavedSettings(data || []);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { data: userData } = await supabase.auth.getUser();

      if (editingId) {
        const { error } = await supabase
          .from("suspension_settings")
          .update({
            ...settings,
            user_id: userData.user?.id,
          })
          .eq("id", editingId)
          .eq("user_id", userData.user?.id);

        if (error) {
          console.error("Error updating suspension settings:", error);
          return;
        }

        // Update UI state directly
        setSavedSettings((prev) =>
          prev.map((s) =>
            s.id === editingId
              ? { ...s, ...settings, user_id: userData.user?.id }
              : s
          )
        );
      } else {
        const { data, error } = await supabase
          .from("suspension_settings")
          .insert([{ ...settings, user_id: userData.user?.id }])
          .select()
          .single();

        if (error) {
          console.error("Error saving suspension settings:", error);
          return;
        }

        // Add new setting to UI state
        setSavedSettings((prev) => [data, ...prev]);
      }

      setSettings({
        fork_compression: null,
        fork_rebound: null,
        shock_high_speed_compression: null,
        shock_low_speed_compression: null,
        shock_rebound: null,
        shock_sag: null,
        notes: "",
      });
      setEditingId(null);
    } finally {
      setIsSaving(false);
    }
  }

  function handleEdit(setting: SuspensionSettings) {
    setSettings({
      fork_compression: setting.fork_compression,
      fork_rebound: setting.fork_rebound,
      shock_high_speed_compression: setting.shock_high_speed_compression,
      shock_low_speed_compression: setting.shock_low_speed_compression,
      shock_rebound: setting.shock_rebound,
      shock_sag: setting.shock_sag,
      notes: setting.notes,
    });
    setEditingId(setting.id ?? null);

    // Scroll to form
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  async function handleDelete(id: string) {
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("suspension_settings")
      .delete()
      .eq("id", id)
      .eq("user_id", userData.user?.id);

    if (error) {
      console.error("Error deleting suspension settings:", error);
      toast({
        title: "Error",
        description: "Failed to delete suspension settings. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Update UI state directly
    setSavedSettings((prev) => prev.filter((s) => s.id !== id));
    toast({
      title: "Success",
      description: "Suspension settings deleted successfully.",
    });
  }

  return (
    <MainLayout>
      <Toaster />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Suspension Settings</h1>

        <div className="grid gap-8">
          {isLoading ? (
            <>
              <LoadingCard title="Latest Settings" />
              <LoadingCard title="Previous Settings" />
            </>
          ) : (
            <div className="grid gap-4">
              {savedSettings.map((setting) => (
                <div key={setting.id} className="relative">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>
                          {format(
                            new Date(setting.created_at || ""),
                            "MMMM do, yyyy"
                          )}
                        </CardTitle>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(setting)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDelete(setting.id || "")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">
                            Fork Settings
                          </h3>
                          <ul className="space-y-2">
                            <li className="flex justify-between items-center">
                              <span className="text-muted-foreground">
                                Compression
                              </span>
                              <span>{setting.fork_compression} clicks</span>
                            </li>
                            <li className="flex justify-between items-center">
                              <span className="text-muted-foreground">
                                Rebound
                              </span>
                              <span>{setting.fork_rebound} clicks</span>
                            </li>
                          </ul>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-2">
                            Shock Settings
                          </h3>
                          <ul className="space-y-2">
                            <li className="flex justify-between items-center">
                              <span className="text-muted-foreground">
                                High Speed Compression
                              </span>
                              <span>
                                {setting.shock_high_speed_compression} clicks
                              </span>
                            </li>
                            <li className="flex justify-between items-center">
                              <span className="text-muted-foreground">
                                Low Speed Compression
                              </span>
                              <span>
                                {setting.shock_low_speed_compression} clicks
                              </span>
                            </li>
                            <li className="flex justify-between items-center">
                              <span className="text-muted-foreground">
                                Rebound
                              </span>
                              <span>{setting.shock_rebound} clicks</span>
                            </li>
                            <li className="flex justify-between items-center">
                              <span className="text-muted-foreground">Sag</span>
                              <span>{setting.shock_sag} mm</span>
                            </li>
                          </ul>
                        </div>

                        {setting.notes && (
                          <div>
                            <h3 className="text-lg font-semibold mb-2">
                              Notes
                            </h3>
                            <p className="text-muted-foreground">
                              {setting.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}

          <form ref={formRef} onSubmit={handleSubmit}>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Fork Settings</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="fork_compression">Compression</Label>
                  <Input
                    id="fork_compression"
                    type="number"
                    value={settings.fork_compression ?? ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        fork_compression: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    placeholder="Enter compression clicks"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fork_rebound">Rebound</Label>
                  <Input
                    id="fork_rebound"
                    type="number"
                    value={settings.fork_rebound ?? ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        fork_rebound: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    placeholder="Enter rebound clicks"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Shock Settings</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="shock_high_speed_compression">
                    High Speed Compression
                  </Label>
                  <Input
                    id="shock_high_speed_compression"
                    type="number"
                    value={settings.shock_high_speed_compression ?? ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        shock_high_speed_compression: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    placeholder="Enter high speed compression clicks"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="shock_low_speed_compression">
                    Low Speed Compression
                  </Label>
                  <Input
                    id="shock_low_speed_compression"
                    type="number"
                    value={settings.shock_low_speed_compression ?? ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        shock_low_speed_compression: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    placeholder="Enter low speed compression clicks"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="shock_rebound">Rebound</Label>
                  <Input
                    id="shock_rebound"
                    type="number"
                    value={settings.shock_rebound ?? ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        shock_rebound: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    placeholder="Enter rebound clicks"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="shock_sag">Sag</Label>
                  <Input
                    id="shock_sag"
                    type="number"
                    value={settings.shock_sag ?? ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        shock_sag: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    placeholder="Enter sag in millimeters"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  className="w-full min-h-[100px] p-2 border rounded-md"
                  value={settings.notes}
                  onChange={(e) =>
                    setSettings({ ...settings, notes: e.target.value })
                  }
                  placeholder="Add any additional notes about your suspension settings..."
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2 mb-8">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <LoadingSpinner className="w-4 h-4 mr-2" /> : null}
                {editingId ? "Update Settings" : "Save Settings"}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSettings({
                      fork_compression: null,
                      fork_rebound: null,
                      shock_high_speed_compression: null,
                      shock_low_speed_compression: null,
                      shock_rebound: null,
                      shock_sag: null,
                      notes: "",
                    });
                    setEditingId(null);
                  }}
                  disabled={isSaving}
                >
                  Cancel Edit
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
