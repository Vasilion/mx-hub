"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

interface Note {
  id: string;
  content: string;
  created_at: string;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", userData.user?.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notes:", error);
      return;
    }

    setNotes(data || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newNote.trim()) return;

    const { error } = await supabase.from("notes").insert([
      {
        content: newNote,
        user_id: (await supabase.auth.getUser()).data.user?.id,
      },
    ]);

    if (error) {
      console.error("Error creating note:", error);
      return;
    }

    setNewNote("");
    fetchNotes();
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Notes</h1>

        <form onSubmit={handleSubmit} className="mb-8">
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Write your note here..."
            className="mb-4"
          />
          <Button type="submit">Save Note</Button>
        </form>

        <div className="grid gap-4">
          {notes.map((note) => (
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
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
