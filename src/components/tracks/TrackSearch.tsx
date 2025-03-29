import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Search, Star, StarOff, MapPin, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { TrackWeather } from "./TrackWeather";
import { TrackAddress } from "./TrackAddress";
import { AddTrack } from "./AddTrack";

interface Track {
  id: number;
  name: string;
  description: string;
  longitude: string;
  latitude: string;
  slug: string;
  status: number;
  created_at: string;
  updated_at: string;
  isFavorite?: boolean;
}

interface FavoriteResponse {
  track_id: string;
  tracks: Track;
}

export default function TrackSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [favorites, setFavorites] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddTrack, setShowAddTrack] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  useEffect(() => {
    fetchFavorites();
  }, []);

  useEffect(() => {
    if (debouncedSearch) {
      searchTracks();
    } else {
      setTracks([]);
    }
  }, [debouncedSearch]);

  async function searchTracks() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("tracks")
      .select("*")
      .ilike("name", `%${debouncedSearch}%`)
      .limit(10);

    if (error) {
      console.error("Error searching tracks:", error);
      toast({
        title: "Error",
        description: "Failed to search tracks. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Mark favorites in search results
    const tracksWithFavorites = data.map((track) => ({
      ...track,
      isFavorite: favorites.some((fav) => fav.id === track.id),
    }));

    setTracks(tracksWithFavorites);
    setIsLoading(false);
  }

  async function fetchFavorites() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = (await supabase
      .from("user_favorites")
      .select(
        `
        track_id,
        tracks:track_id (
          id,
          name,
          description,
          longitude,
          latitude,
          slug,
          status,
          created_at,
          updated_at
        )
      `
      )
      .eq("user_id", user.id)) as {
      data: FavoriteResponse[] | null;
      error: any;
    };

    if (error) {
      console.error("Error fetching favorites:", error);
      toast({
        title: "Error",
        description: "Failed to load favorites. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (!data) return;

    const favoriteTracks = data.map((fav) => ({
      ...fav.tracks,
      isFavorite: true,
    }));

    setFavorites(favoriteTracks);
  }

  async function toggleFavorite(track: Track) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "Please sign in to favorite tracks.",
        variant: "destructive",
      });
      return;
    }

    const isFavorite = favorites.some((fav) => fav.id === track.id);

    if (isFavorite) {
      const { error } = await supabase
        .from("user_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("track_id", track.id);

      if (error) {
        console.error("Error removing favorite:", error);
        toast({
          title: "Error",
          description: "Failed to remove favorite. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setFavorites(favorites.filter((fav) => fav.id !== track.id));
      setTracks(
        tracks.map((t) => (t.id === track.id ? { ...t, isFavorite: false } : t))
      );
      toast({
        title: "Success",
        description: "Track removed from favorites.",
      });
    } else {
      const { error } = await supabase.from("user_favorites").insert({
        user_id: user.id,
        track_id: track.id,
      });

      if (error) {
        console.error("Error adding favorite:", error);
        toast({
          title: "Error",
          description: "Failed to add favorite. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setFavorites([...favorites, track]);
      setTracks(
        tracks.map((t) => (t.id === track.id ? { ...t, isFavorite: true } : t))
      );
      toast({
        title: "Success",
        description: "Track added to favorites.",
      });
    }
  }

  function handleTrackAdded() {
    setShowAddTrack(false);
    fetchFavorites();
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <Input
            type="text"
            placeholder="Search tracks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2"
          />
        </div>
        <Button
          variant="outline"
          className="ml-4"
          onClick={() => setShowAddTrack(!showAddTrack)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Track
        </Button>
      </div>

      {showAddTrack && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Track</CardTitle>
          </CardHeader>
          <CardContent>
            <AddTrack onTrackAdded={handleTrackAdded} />
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search">Search Results</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>
        <TabsContent value="search">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : tracks.length > 0 ? (
            <div className="grid gap-4">
              {tracks.map((track) => (
                <Card key={track.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-medium">
                      {track.name}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => toggleFavorite(track)}
                    >
                      {track.isFavorite ? (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ) : (
                        <StarOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <TrackAddress
                        latitude={track.latitude}
                        longitude={track.longitude}
                      />
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="mr-1 h-4 w-4" />
                        Added {new Date(track.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="mt-4">
                      <TrackWeather
                        latitude={track.latitude}
                        longitude={track.longitude}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="text-center py-8 text-muted-foreground">
              No tracks found matching your search.
            </div>
          ) : null}
        </TabsContent>
        <TabsContent value="favorites">
          {favorites.length > 0 ? (
            <div className="grid gap-4">
              {favorites.map((track) => (
                <Card key={track.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-medium">
                      {track.name}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => toggleFavorite(track)}
                    >
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <TrackAddress
                        latitude={track.latitude}
                        longitude={track.longitude}
                      />
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="mr-1 h-4 w-4" />
                        Added {new Date(track.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="mt-4">
                      <TrackWeather
                        latitude={track.latitude}
                        longitude={track.longitude}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No favorite tracks yet. Search for tracks and click the star icon
              to add them to your favorites.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
