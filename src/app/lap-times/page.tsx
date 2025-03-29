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
import { Plus, Trash2, ChevronDown } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";

interface Track {
  id: string;
  name: string;
  description: string | null;
  longitude: string | null;
  latitude: string | null;
  slug: string;
  status: number;
}

interface Favorite {
  track_id: string;
  tracks: Track;
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
  description: string | null;
  longitude: string | null;
  latitude: string | null;
  slug: string;
  status: number;
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
  const [isMobile, setIsMobile] = useState(false);
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TrackWithSessions[]>([]);
  const [isAddingFavorite, setIsAddingFavorite] = useState(false);

  useEffect(() => {
    fetchTracks();
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
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
      const slug = newTrackName.trim().toLowerCase().replace(/\s+/g, "-");

      const { data, error } = await supabase
        .from("tracks")
        .insert([
          {
            name: newTrackName.trim(),
            slug: slug,
            status: 1,
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

      const newTrack: TrackWithSessions = {
        id: data.id,
        name: data.name,
        description: data.description,
        longitude: data.longitude,
        latitude: data.latitude,
        slug: data.slug,
        status: data.status,
        sessions: [],
        fastest_lap: Infinity,
      };

      setTracks((prevTracks) => [...prevTracks, newTrack]);
      setSelectedTrack(newTrack);
      setNewTrackName("");
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

      const { data: favoritesData, error: favoritesError } = await supabase
        .from("user_favorites")
        .select(
          `
          track_id,
          tracks (
            id,
            name,
            description,
            longitude,
            latitude,
            slug,
            status
          )
        `
        )
        .eq("user_id", userData.user?.id)
        .order("created_at", { ascending: false });

      if (favoritesError) {
        console.error("Error fetching favorites:", favoritesError);
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

      const trackMap = (favoritesData as unknown as Favorite[]).reduce<
        Record<string, TrackWithSessions>
      >((acc, favorite) => {
        const track = favorite.tracks;
        acc[track.id] = {
          id: track.id,
          name: track.name,
          description: track.description,
          longitude: track.longitude,
          latitude: track.latitude,
          slug: track.slug,
          status: track.status,
          sessions: [],
          fastest_lap: Infinity,
        };
        return acc;
      }, {});

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
      setIsRunning(true);
    } else {
      clearInterval(intervalRef.current);
      const currentTime = Date.now() - startTimeRef.current;

      if (laps.length === 0) {
        setLaps([
          {
            number: 1,
            time: currentTime,
            splitTime: currentTime,
          },
        ]);
      } else {
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
      }

      setTimeout(() => {
        handleSaveSession();
      }, 0);

      setIsRunning(false);
    }
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

      // Ensure we have at least one lap
      let finalLaps = laps;
      if (finalLaps.length === 0) {
        finalLaps = [
          {
            number: 1,
            time: sessionTime,
            splitTime: sessionTime,
          },
        ];
      }

      const sessionData = {
        track_id: selectedTrack.id,
        date: format(new Date(), "yyyy-MM-dd"),
        total_time: sessionTime,
        laps: finalLaps,
        user_id: userData.user.id,
      };

      const { data, error } = await supabase
        .from("lap_sessions")
        .insert([sessionData])
        .select()
        .single();

      if (error) {
        console.error("Error saving session:", error.message);
        return;
      }

      // Update the UI state directly
      setTracks((prevTracks) =>
        prevTracks.map((track) => {
          if (track.id === selectedTrack.id) {
            const newSessions = [data, ...track.sessions];
            const newFastestLap = Math.min(
              track.fastest_lap,
              ...finalLaps.map((lap) => lap.time)
            );
            return {
              ...track,
              sessions: newSessions,
              fastest_lap: newFastestLap,
            };
          }
          return track;
        })
      );

      // Update selected track to reflect the changes
      setSelectedTrack((prevTrack) => {
        if (!prevTrack) return null;
        const newSessions = [data, ...prevTrack.sessions];
        const newFastestLap = Math.min(
          prevTrack.fastest_lap,
          ...finalLaps.map((lap) => lap.time)
        );
        return {
          ...prevTrack,
          sessions: newSessions,
          fastest_lap: newFastestLap,
        };
      });

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

  async function handleDeleteSession(sessionId: string) {
    try {
      const { error } = await supabase
        .from("lap_sessions")
        .delete()
        .eq("id", sessionId);

      if (error) {
        console.error("Error deleting session:", error);
        toast({
          title: "Error",
          description: "Failed to delete session. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Update the UI state directly
      setTracks((prevTracks) =>
        prevTracks.map((track) => {
          if (track.id === selectedTrack?.id) {
            const newSessions = track.sessions.filter(
              (s) => s.id !== sessionId
            );
            const newFastestLap =
              newSessions.length > 0
                ? Math.min(
                    ...newSessions.flatMap((s) => s.laps.map((l) => l.time))
                  )
                : Infinity;
            return {
              ...track,
              sessions: newSessions,
              fastest_lap: newFastestLap,
            };
          }
          return track;
        })
      );

      // Update selected track to reflect the changes
      setSelectedTrack((prevTrack) => {
        if (!prevTrack) return null;
        const newSessions = prevTrack.sessions.filter(
          (s) => s.id !== sessionId
        );
        const newFastestLap =
          newSessions.length > 0
            ? Math.min(...newSessions.flatMap((s) => s.laps.map((l) => l.time)))
            : Infinity;
        return {
          ...prevTrack,
          sessions: newSessions,
          fastest_lap: newFastestLap,
        };
      });

      toast({
        title: "Success",
        description: "Session deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting session:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  }

  const handleDeleteTrack = async (trackId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this track and all its sessions?"
      )
    ) {
      return;
    }

    try {
      // Delete all sessions for this track first
      const { error: sessionsError } = await supabase
        .from("lap_sessions")
        .delete()
        .eq("track_id", trackId);

      if (sessionsError) {
        console.error("Error deleting sessions:", sessionsError);
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
        .eq("id", trackId);

      if (trackError) {
        console.error("Error deleting track:", trackError);
        toast({
          title: "Error",
          description: "Failed to delete track. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Update UI state directly
      setTracks((prevTracks) => prevTracks.filter((t) => t.id !== trackId));
      if (selectedTrack?.id === trackId) {
        setSelectedTrack(null);
      }
      toast({
        title: "Success",
        description: "Track and all its sessions deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting track:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  function getBestLapTime(laps: Lap[]): number {
    if (laps.length === 0) return Infinity;
    return Math.min(...laps.map((lap) => lap.time));
  }

  function getBestLapNumber(laps: Lap[]): number {
    if (laps.length === 0) return 0;
    const bestTime = getBestLapTime(laps);
    return laps.find((lap) => lap.time === bestTime)?.number || 0;
  }

  async function handleSearchTracks() {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("tracks")
        .select("*")
        .ilike("name", `%${searchQuery.trim()}%`)
        .limit(5);

      if (error) {
        console.error("Error searching tracks:", error);
        return;
      }

      setSearchResults(data);
    } catch (err) {
      console.error("Error in handleSearchTracks:", err);
    }
  }

  async function handleAddToFavorites(track: Track) {
    try {
      setIsAddingFavorite(true);
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("user_favorites")
        .insert([{ user_id: userData.user?.id, track_id: track.id }]);

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already Added",
            description: "This track is already in your favorites.",
          });
        } else {
          console.error("Error adding to favorites:", error);
          toast({
            title: "Error",
            description: "Failed to add track to favorites.",
            variant: "destructive",
          });
        }
        return;
      }

      const newTrack: TrackWithSessions = {
        id: track.id,
        name: track.name,
        description: track.description,
        longitude: track.longitude,
        latitude: track.latitude,
        slug: track.slug,
        status: track.status,
        sessions: [],
        fastest_lap: Infinity,
      };

      setTracks((prevTracks) => [...prevTracks, newTrack]);
      setSelectedTrack(newTrack);
      setSearchQuery("");
      setSearchResults([]);
      toast({
        title: "Success",
        description: "Track added to favorites.",
      });
    } catch (err) {
      console.error("Error in handleAddToFavorites:", err);
      toast({
        title: "Error",
        description: "Failed to add track to favorites.",
        variant: "destructive",
      });
    } finally {
      setIsAddingFavorite(false);
    }
  }

  return (
    <MainLayout>
      <Toaster />
      <div className="max-w-4xl mx-auto">
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
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        placeholder="Search tracks..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          handleSearchTracks();
                        }}
                        className="flex-1"
                      />
                    </div>
                    {searchResults.length > 0 && (
                      <div className="grid gap-2">
                        {searchResults.map((track) => (
                          <Button
                            key={track.id}
                            variant="outline"
                            className="justify-start w-full"
                            onClick={() => handleAddToFavorites(track)}
                            disabled={isAddingFavorite}
                          >
                            {isAddingFavorite ? (
                              <LoadingSpinner className="w-4 h-4 mr-2" />
                            ) : (
                              <Plus className="w-4 h-4 mr-2" />
                            )}
                            {track.name}
                          </Button>
                        ))}
                      </div>
                    )}
                    <div className="grid gap-2">
                      {tracks.map((track) => (
                        <Button
                          key={track.id}
                          variant={
                            selectedTrack?.id === track.id
                              ? "default"
                              : "outline"
                          }
                          className="justify-start w-full"
                          onClick={() => setSelectedTrack(track)}
                        >
                          <div className="flex justify-between w-full items-center">
                            <span className="truncate">{track.name}</span>
                            {track.fastest_lap !== Infinity && (
                              <span className="text-sm text-muted-foreground ml-2 whitespace-nowrap">
                                Best: {formatTime(track.fastest_lap)}
                              </span>
                            )}
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {selectedTrack ? (
                <>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Timer - {selectedTrack.name}</CardTitle>
                      {selectedTrack.fastest_lap !== Infinity && (
                        <div className="text-sm text-muted-foreground">
                          Best: {formatTime(selectedTrack.fastest_lap)}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        <div className="text-4xl font-mono text-center">
                          {formatTime(sessionTime)}
                        </div>
                        <div className="flex justify-center gap-2 flex-wrap">
                          <Button
                            variant={isRunning ? "destructive" : "default"}
                            onClick={handleStartStop}
                            className="w-24"
                          >
                            {isRunning ? "Stop" : "Start"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleLap}
                            disabled={!isRunning}
                            className="w-24"
                          >
                            Lap
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleReset}
                            className="w-24"
                          >
                            Reset
                          </Button>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold">Lap Times</h3>
                          </div>
                          <div className="space-y-2">
                            {laps.map((lap, index) => {
                              const isBestLap =
                                lap.time === getBestLapTime(laps);
                              return (
                                <div
                                  key={lap.number}
                                  className={`flex items-center justify-between p-2 rounded-md ${
                                    isBestLap
                                      ? "bg-green-500/20"
                                      : "bg-accent/50"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span>Lap {laps.length - index}</span>
                                    {isBestLap && (
                                      <span className="text-xs text-green-500">
                                        Best
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span className="font-mono whitespace-nowrap">
                                      {formatTime(lap.time)}
                                    </span>
                                    <span className="font-mono text-muted-foreground whitespace-nowrap">
                                      {formatTime(lap.splitTime)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Session History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        {selectedTrack?.sessions.map((session) => (
                          <AccordionItem
                            key={session.id}
                            value={session.id}
                            className="border-0"
                          >
                            <AccordionTrigger className="w-full p-0 hover:no-underline">
                              <div className="flex items-center justify-between w-full p-3 rounded-md transition-colors hover:bg-red-500/10 group">
                                <div className="flex flex-col items-start gap-1">
                                  <span className="font-medium">
                                    {new Date(
                                      session.created_at
                                    ).toLocaleDateString()}
                                  </span>
                                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    Total Time: {formatTime(session.total_time)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteSession(session.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-2"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </div>
                                  <ChevronDown className="h-4 w-4 transition-transform duration-200 transform group-data-[state=open]:rotate-180" />
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="px-3 py-2 space-y-2">
                                {Array.isArray(session.laps) &&
                                  session.laps.map((lap, index) => {
                                    const isBestLap =
                                      lap.time === getBestLapTime(session.laps);
                                    return (
                                      <div
                                        key={`${session.id}-${index}`}
                                        className={`flex items-center justify-between p-2 rounded-md ${
                                          isBestLap
                                            ? "bg-green-500/20"
                                            : "bg-accent/50"
                                        }`}
                                      >
                                        <div className="flex items-center gap-2">
                                          <span>Lap {lap.number}</span>
                                          {isBestLap && (
                                            <span className="text-xs text-green-500">
                                              Best
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-4">
                                          <span className="font-mono whitespace-nowrap">
                                            {formatTime(lap.time)}
                                          </span>
                                          <span className="font-mono text-muted-foreground whitespace-nowrap">
                                            {formatTime(lap.splitTime)}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Timer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center text-muted-foreground">
                      Please select a track to start timing laps
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
