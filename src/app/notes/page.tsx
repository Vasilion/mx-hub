"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { LoadingCard } from "@/components/ui/loading-card";
import { Pencil, Trash2, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";

interface Note {
  id: string;
  content: string;
  created_at: string;
}

export default function NotesPage() {
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    try {
      setIsLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching notes:", error);
        return;
      }

      setNotes(data || []);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      setIsSaving(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from("notes")
        .insert([
          {
            content: newNote,
            user_id: userData.user.id,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error creating note:", error);
        return;
      }

      setNewNote("");
      setNotes((prev) => [data, ...prev]);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingNote || !editContent.trim()) return;

    try {
      setIsSaving(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { error } = await supabase
        .from("notes")
        .update({ content: editContent })
        .eq("id", editingNote.id)
        .eq("user_id", userData.user.id);

      if (error) {
        console.error("Error updating note:", error);
        return;
      }

      setNotes((prev) =>
        prev.map((note) =>
          note.id === editingNote.id ? { ...note, content: editContent } : note
        )
      );
      setEditingNote(null);
      setEditContent("");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      setIsDeleting(id);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", id)
        .eq("user_id", userData.user.id);

      if (error) {
        console.error("Error deleting note:", error);
        toast({
          title: "Error",
          description: "Failed to delete note. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setNotes((prev) => prev.filter((note) => note.id !== id));
      if (editingNote?.id === id) {
        setEditingNote(null);
        setEditContent("");
      }
      toast({
        title: "Success",
        description: "Note deleted successfully.",
      });
    } catch (err) {
      console.error("Unexpected error:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  }

  return (
    <MainLayout>
      <Toaster />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Notes</h1>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add Note</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Write your note here..."
                className="mb-4"
              />
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <LoadingSpinner className="w-4 h-4 mr-2" /> : null}
                Save Note
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {isLoading ? (
            <>
              <LoadingCard title="Note" />
              <LoadingCard title="Note" />
            </>
          ) : notes.length > 0 ? (
            notes.map((note) => (
              <Card key={note.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm text-muted-foreground">
                      {format(new Date(note.created_at), "PPP")}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingNote(note);
                          setEditContent(note.content);
                        }}
                        className="text-primary hover:text-primary/90"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(note.id)}
                        disabled={isDeleting === note.id}
                        className="text-destructive hover:text-destructive/90"
                      >
                        {isDeleting === note.id ? (
                          <LoadingSpinner className="w-4 h-4" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {editingNote?.id === note.id ? (
                    <form onSubmit={handleUpdate}>
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="mb-4"
                      />
                      <div className="flex gap-2">
                        <Button type="submit" disabled={isSaving}>
                          {isSaving ? (
                            <LoadingSpinner className="w-4 h-4 mr-2" />
                          ) : null}
                          Update
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditingNote(null);
                            setEditContent("");
                          }}
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <p className="whitespace-pre-wrap">{note.content}</p>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No notes yet. Add your first note using the form above.
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
