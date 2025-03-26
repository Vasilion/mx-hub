"use client";

import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

interface SuspensionSettings {
  id?: string;
  fork_compression: number | null;
  fork_rebound: number | null;
  shock_high_speed_compression: number | null;
  shock_low_speed_compression: number | null;
  shock_rebound: number | null;
  notes: string;
  created_at?: string;
}

export default function SuspensionPage() {
  const [settings, setSettings] = useState<SuspensionSettings>({
    fork_compression: null,
    fork_rebound: null,
    shock_high_speed_compression: null,
    shock_low_speed_compression: null,
    shock_rebound: null,
    notes: "",
  });
  const [savedSettings, setSavedSettings] = useState<SuspensionSettings[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("suspension_settings")
      .select("*")
      .eq("user_id", userData.user?.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching suspension settings:", error);
      return;
    }

    setSavedSettings(data || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

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
    } else {
      const { error } = await supabase
        .from("suspension_settings")
        .insert([{ ...settings, user_id: userData.user?.id }]);

      if (error) {
        console.error("Error saving suspension settings:", error);
        return;
      }
    }

    setSettings({
      fork_compression: null,
      fork_rebound: null,
      shock_high_speed_compression: null,
      shock_low_speed_compression: null,
      shock_rebound: null,
      notes: "",
    });
    setEditingId(null);
    fetchSettings();
  }

  function handleEdit(setting: SuspensionSettings) {
    setSettings({
      fork_compression: setting.fork_compression,
      fork_rebound: setting.fork_rebound,
      shock_high_speed_compression: setting.shock_high_speed_compression,
      shock_low_speed_compression: setting.shock_low_speed_compression,
      shock_rebound: setting.shock_rebound,
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
      return;
    }

    fetchSettings();
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Suspension Settings</h1>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Saved Settings</h2>
          <div className="grid gap-4">
            {savedSettings.map((setting) => (
              <Card key={setting.id}>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">
                    {format(new Date(setting.created_at!), "PPP")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <h3 className="font-semibold mb-2">Fork Settings</h3>
                      <p>Compression: {setting.fork_compression}</p>
                      <p>Rebound: {setting.fork_rebound}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Shock Settings</h3>
                      <p>
                        High Speed Compression:{" "}
                        {setting.shock_high_speed_compression}
                      </p>
                      <p>
                        Low Speed Compression:{" "}
                        {setting.shock_low_speed_compression}
                      </p>
                      <p>Rebound: {setting.shock_rebound}</p>
                    </div>
                  </div>
                  {setting.notes && (
                    <div>
                      <h3 className="font-semibold mb-2">Notes</h3>
                      <p className="whitespace-pre-wrap">{setting.notes}</p>
                    </div>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleEdit(setting)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => handleDelete(setting.id!)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

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

          <Button type="submit" className="mb-8">
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
                  notes: "",
                });
                setEditingId(null);
              }}
              className="ml-2"
            >
              Cancel Edit
            </Button>
          )}
        </form>
      </div>
    </MainLayout>
  );
}
