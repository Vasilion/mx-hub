"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { LoadingCard } from "@/components/ui/loading-card";
import { MainLayout } from "@/components/layout/main-layout";
import { Plus, Trash2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";

interface Track {
  id: string;
  name: string;
}

interface Lap {
  number: number;
  time: number;
  splitTime: number;
}

interface Session {
  id: string;
  track_id: string;
  date: string;
  total_time: number;
  laps: Lap[];
  created_at: string;
}

interface TrackWithSessions {
  id: string;
  name: string;
  sessions: Session[];
  fastest_lap: number;
}

export default function LapTimerPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [laps, setLaps] = useState<Lap[]>([]);
  const [tracks, setTracks] = useState<TrackWithSessions[]>([]);
  const [newTrackName, setNewTrackName] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<TrackWithSessions | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingTrack, setIsAddingTrack] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const startTimeRef = useRef<number>(0);
  const lastLapTimeRef = useRef<number>(0);

  useEffect(() => {
    fetchTracks();
  }, []);

  function formatTime(ms: number) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`;
  }

  async function handleAddTrack(e: React.FormEvent) {
    e.preventDefault();
    if (!newTrackName.trim()) return;

    try {
      setIsAddingTrack(true);
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("tracks")
        .insert([{ name: newTrackName.trim(), user_id: userData.user?.id }])
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
      const newTrack: TrackWithSessions = {
        id: data.id,
        name: data.name,
        sessions: [],
        fastest_lap: Infinity,
      };
      setSelectedTrack(newTrack);
      await fetchTracks();
    } catch (err) {
      console.error("Error in handleAddTrack:", err);
    } finally {
      setIsAddingTrack(false);
    }
  }

  async function fetchTracks() {
    try {
      setIsLoading(true);
      const { data: userData } = await supabase.auth.getUser();

      const { data: tracksData, error: tracksError } = await supabase
        .from("tracks")
        .select("*")
        .eq("user_id", userData.user?.id)
        .order("name");

      if (tracksError) {
        console.error("Error fetching tracks:", tracksError);
        return;
      }

      const { data: sessionsData, error: sessionsError } = await supabase
        .from("lap_sessions")
        .select("*")
        .eq("user_id", userData.user?.id)
        .order("created_at", { ascending: false });

      if (sessionsError) {
        console.error("Error fetching sessions:", sessionsError);
        return;
      }

      const trackMap = tracksData.reduce<Record<string, TrackWithSessions>>(
        (acc, track) => {
          acc[track.id] = {
            id: track.id,
            name: track.name,
            sessions: [],
            fastest_lap: Infinity,
          };
          return acc;
        },
        {}
      );

      sessionsData.forEach((session) => {
        if (trackMap[session.track_id]) {
          trackMap[session.track_id].sessions.push(session);
          session.laps.forEach((lap: Lap) => {
            if (lap.time < trackMap[session.track_id].fastest_lap) {
              trackMap[session.track_id].fastest_lap = lap.time;
            }
          });
        }
      });

      const newTracks = Object.values(trackMap);
      setTracks(newTracks);

      if (selectedTrack) {
        const updatedSelectedTrack = newTracks.find(
          (t) => t.id === selectedTrack.id
        );
        if (updatedSelectedTrack) {
          setSelectedTrack(updatedSelectedTrack);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleStartStop() {
    if (!selectedTrack) {
      alert("Please select a track first");
      return;
    }

    if (!isRunning) {
      if (sessionTime === 0) {
        setLaps([]);
        lastLapTimeRef.current = 0;
      }
      startTimeRef.current = Date.now() - sessionTime;
      intervalRef.current = setInterval(() => {
        setSessionTime(Date.now() - startTimeRef.current);
      }, 10);
    } else {
      clearInterval(intervalRef.current);
      const currentTime = Date.now() - startTimeRef.current;
      const lapTime = currentTime - lastLapTimeRef.current;
      if (lapTime > 0) {
        setLaps((prevLaps) => [
          ...prevLaps,
          {
            number: prevLaps.length + 1,
            time: lapTime,
            splitTime: currentTime,
          },
        ]);
      }
      handleSaveSession();
    }
    setIsRunning(!isRunning);
  }

  function handleLap() {
    if (!isRunning) return;

    const currentTime = Date.now() - startTimeRef.current;
    const lapTime = currentTime - lastLapTimeRef.current;

    setLaps((prevLaps) => [
      ...prevLaps,
      {
        number: prevLaps.length + 1,
        time: lapTime,
        splitTime: currentTime,
      },
    ]);

    lastLapTimeRef.current = currentTime;
  }

  async function handleSaveSession() {
    if (!selectedTrack) {
      console.error("No track selected");
      return;
    }

    try {
      setIsSaving(true);
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        console.error("Error getting user:", userError);
        return;
      }

      const sessionData = {
        track_id: selectedTrack.id,
        date: format(new Date(), "yyyy-MM-dd"),
        total_time: sessionTime,
        laps: laps,
        user_id: userData.user.id,
      };

      const { error } = await supabase
        .from("lap_sessions")
        .insert([sessionData])
        .select()
        .single();

      if (error) {
        console.error("Error saving session:", error.message);
        return;
      }

      await fetchTracks();
      handleReset();
    } catch (err) {
      console.error("Error in handleSaveSession:", err);
    } finally {
      setIsSaving(false);
    }
  }

  function handleReset() {
    setIsRunning(false);
    setSessionTime(0);
    setLaps([]);
    lastLapTimeRef.current = 0;
    clearInterval(intervalRef.current);
  }

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from("sessions")
        .delete()
        .eq("id", sessionId);

      if (error) {
        console.error("Error deleting session:", error);
        return;
      }

      await fetchTracks();
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  };

  return (
    <MainLayout>
      <Toaster />
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Lap Timer</h1>

        <div className="grid gap-6">
          {isLoading ? (
            <>
              <LoadingCard title="Select Track" />
              <LoadingCard title="Timer" />
            </>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Select Track</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter track name"
                        value={newTrackName}
                        onChange={(e) => setNewTrackName(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={handleAddTrack} disabled={isAddingTrack}>
                        {isAddingTrack ? (
                          <LoadingSpinner className="w-4 h-4 mr-2" />
                        ) : (
                          <Plus className="w-4 h-4 mr-2" />
                        )}
                        Add Track
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {tracks.map((track) => (
                        <Button
                          key={track.id}
                          variant={
                            selectedTrack?.id === track.id
                              ? "default"
                              : "outline"
                          }
                          className="justify-start"
                          onClick={() => setSelectedTrack(track)}
                        >
                          {track.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Timer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="text-4xl font-mono text-center">
                      {formatTime(sessionTime)}
                    </div>
                    <div className="flex justify-center gap-2">
                      <Button
                        variant={isRunning ? "destructive" : "default"}
                        onClick={handleStartStop}
                        className="w-24"
                      >
                        {isRunning ? "Stop" : "Start"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleReset}
                        className="w-24"
                      >
                        Reset
                      </Button>
                    </div>
                    {selectedTrack && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold">Lap Times</h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleLap}
                            disabled={!isRunning}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Lap
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {laps.map((lap, index) => (
                            <div
                              key={lap.number}
                              className="flex items-center justify-between p-2 bg-accent/50 rounded-md"
                            >
                              <span>Lap {laps.length - index}</span>
                              <span className="font-mono">
                                {formatTime(lap.time)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {selectedTrack && (
                <Card>
                  <CardHeader>
                    <CardTitle>Session History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedTrack.sessions.map((session) => (
                        <div key={session.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">
                              {format(new Date(session.date), "PPP")}
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSession(session.id)}
                              className="text-destructive hover:text-destructive/90"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid gap-2">
                            {session.laps.map((lap, index) => (
                              <div
                                key={lap.number}
                                className="flex items-center justify-between p-2 bg-accent/50 rounded-md"
                              >
                                <span>Lap {session.laps.length - index}</span>
                                <span className="font-mono">
                                  {formatTime(lap.time)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
