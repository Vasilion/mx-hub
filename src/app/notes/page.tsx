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

interface Note {
  id: string;
  content: string;
  created_at: string;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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

  return (
    <MainLayout>
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
                  <CardTitle className="text-sm text-muted-foreground">
                    {format(new Date(note.created_at), "PPP")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{note.content}</p>
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
