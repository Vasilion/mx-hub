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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";

interface Track {
  id: string;
  name: string;
  created_at: string;
}

export default function TracksPage() {
  const { toast } = useToast();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [newTrackName, setNewTrackName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [editName, setEditName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrack || !editName.trim()) return;

    try {
      setIsSaving(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { error } = await supabase
        .from("tracks")
        .update({ name: editName.trim() })
        .eq("id", editingTrack.id)
        .eq("user_id", userData.user.id);

      if (error) {
        if (error.code === "23505") {
          alert("A track with this name already exists");
        } else {
          console.error("Error updating track:", error);
        }
        return;
      }

      setTracks((prev) =>
        prev.map((track) =>
          track.id === editingTrack.id
            ? { ...track, name: editName.trim() }
            : track
        )
      );
      setEditingTrack(null);
      setEditName("");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this track? This will also delete all associated lap times."
      )
    ) {
      return;
    }

    try {
      setIsDeleting(id);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Delete all lap sessions for this track first
      const { error: sessionsError } = await supabase
        .from("lap_sessions")
        .delete()
        .eq("track_id", id);

      if (sessionsError) {
        console.error("Error deleting lap sessions:", sessionsError);
        toast({
          title: "Error",
          description: "Failed to delete track sessions. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Then delete the track
      const { error: trackError } = await supabase
        .from("tracks")
        .delete()
        .eq("id", id)
        .eq("user_id", userData.user.id);

      if (trackError) {
        console.error("Error deleting track:", trackError);
        toast({
          title: "Error",
          description: "Failed to delete track. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setTracks((prev) => prev.filter((track) => track.id !== id));
      if (editingTrack?.id === id) {
        setEditingTrack(null);
        setEditName("");
      }
      toast({
        title: "Success",
        description: "Track deleted successfully.",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <MainLayout>
      <Toaster />
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
                  <div className="flex items-center justify-between">
                    {editingTrack?.id === track.id ? (
                      <form onSubmit={handleUpdate} className="flex-1 mr-4">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full"
                          autoFocus
                        />
                      </form>
                    ) : (
                      <CardTitle>{track.name}</CardTitle>
                    )}
                    <div className="flex items-center gap-2">
                      {editingTrack?.id === track.id ? (
                        <>
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            onClick={handleUpdate}
                            disabled={isSaving}
                            className="text-primary hover:text-primary/90"
                          >
                            {isSaving ? (
                              <LoadingSpinner className="w-4 h-4" />
                            ) : (
                              "Save"
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingTrack(null);
                              setEditName("");
                            }}
                            disabled={isSaving}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingTrack(track);
                            setEditName(track.name);
                          }}
                          className="text-primary hover:text-primary/90"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(track.id)}
                        disabled={isDeleting === track.id}
                        className="text-destructive hover:text-destructive/90"
                      >
                        {isDeleting === track.id ? (
                          <LoadingSpinner className="w-4 h-4" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Added {format(new Date(track.created_at), "PPP")}
                    </span>
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
