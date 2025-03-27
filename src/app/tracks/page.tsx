"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { LoadingCard } from "@/components/ui/loading-card";
import { Plus } from "lucide-react";

interface Track {
  id: string;
  name: string;
  created_at: string;
}

export default function TracksPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [newTrackName, setNewTrackName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      setIsLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from("tracks")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("name");

      if (error) {
        console.error("Error fetching tracks:", error);
        return;
      }

      setTracks(data || []);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrackName.trim()) return;

    try {
      setIsCreating(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from("tracks")
        .insert([
          {
            name: newTrackName.trim(),
            user_id: userData.user.id,
          },
        ])
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          alert("A track with this name already exists");
        } else {
          console.error("Error adding track:", error);
        }
        return;
      }

      setNewTrackName("");
      setTracks((prev) => [...prev, data]);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(id);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { error } = await supabase
        .from("tracks")
        .delete()
        .eq("id", id)
        .eq("user_id", userData.user.id);

      if (error) {
        console.error("Error deleting track:", error);
        return;
      }

      setTracks((prev) => prev.filter((track) => track.id !== id));
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Tracks</h1>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add Track</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex gap-4">
              <Input
                value={newTrackName}
                onChange={(e) => setNewTrackName(e.target.value)}
                placeholder="Enter track name"
                className="flex-1"
              />
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add Track
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {isLoading ? (
            <>
              <LoadingCard title="Track" />
              <LoadingCard title="Track" />
            </>
          ) : tracks.length > 0 ? (
            tracks.map((track) => (
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
                      disabled={isDeleting === track.id}
                    >
                      {isDeleting === track.id ? (
                        <LoadingSpinner className="w-4 h-4 mr-2" />
                      ) : null}
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No tracks yet. Add your first track using the form above.
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
