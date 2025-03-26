"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

interface Track {
  id: string;
  name: string;
  created_at: string;
}

export default function TracksPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [newTrackName, setNewTrackName] = useState("");

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("tracks")
      .select("*")
      .eq("user_id", userData.user?.id)
      .order("name");

    if (error) {
      console.error("Error fetching tracks:", error);
      return;
    }

    setTracks(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrackName.trim()) return;

    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("tracks").insert([
      {
        name: newTrackName.trim(),
        user_id: userData.user?.id,
      },
    ]);

    if (error) {
      if (error.code === "23505") {
        alert("A track with this name already exists");
      } else {
        console.error("Error adding track:", error);
      }
      return;
    }

    setNewTrackName("");
    fetchTracks();
  };

  const handleDelete = async (id: string) => {
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("tracks")
      .delete()
      .eq("id", id)
      .eq("user_id", userData.user?.id);

    if (error) {
      console.error("Error deleting track:", error);
      return;
    }

    fetchTracks();
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Tracks</h1>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Track Name</Label>
              <Input
                id="name"
                value={newTrackName}
                onChange={(e) => setNewTrackName(e.target.value)}
                placeholder="Enter track name"
              />
            </div>
            <Button type="submit">Add Track</Button>
          </div>
        </form>

        <div className="grid gap-4">
          {tracks.map((track) => (
            <Card key={track.id}>
              <CardHeader>
                <CardTitle>{track.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Added {format(new Date(track.created_at), "PPP")}
                  </span>
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(track.id)}
                  >
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
