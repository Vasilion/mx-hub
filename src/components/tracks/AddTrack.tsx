import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, MapPin } from "lucide-react";

interface AddTrackProps {
  onTrackAdded: () => void;
}

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

export function AddTrack({ onTrackAdded }: AddTrackProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [useAddress, setUseAddress] = useState(true);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  async function searchAddress() {
    if (!address) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          address
        )}&limit=5`
      );
      const data = await response.json();
      console.log("Address search results:", data);
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error searching address:", error);
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(searchAddress, 300);
    return () => clearTimeout(timeoutId);
  }, [address]);

  function selectAddress(suggestion: AddressSuggestion) {
    setAddress(suggestion.display_name);
    setLatitude(suggestion.lat);
    setLongitude(suggestion.lon);
    setShowSuggestions(false);
    setSuggestions([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Please sign in to add tracks");
      }

      let trackLatitude = latitude;
      let trackLongitude = longitude;

      if (useAddress && (!trackLatitude || !trackLongitude)) {
        throw new Error("Please select an address from the suggestions");
      }

      // Generate a unique slug from the track name
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // Insert the track
      const { data: track, error: trackError } = await supabase
        .from("tracks")
        .insert({
          name,
          latitude: trackLatitude,
          longitude: trackLongitude,
          slug,
          status: 1,
          description: null, // explicitly set to null since it's optional
        })
        .select()
        .single();

      if (trackError) {
        console.error("Track insertion error:", trackError);
        if (trackError.code === "23505") {
          throw new Error(
            "A track with this name already exists. Please choose a different name."
          );
        }
        throw new Error(trackError.message || "Failed to add track");
      }

      if (!track) {
        throw new Error("Failed to create track - no data returned");
      }

      // Add to user's favorites
      const { error: favoriteError } = await supabase
        .from("user_favorites")
        .insert({
          user_id: user.id,
          track_id: track.id,
        });

      if (favoriteError) {
        console.error("Favorite insertion error:", favoriteError);
        throw new Error(
          favoriteError.message || "Failed to add track to favorites"
        );
      }

      toast({
        title: "Success",
        description: "Track added successfully!",
      });

      // Reset form
      setName("");
      setAddress("");
      setLatitude("");
      setLongitude("");
      onTrackAdded();
    } catch (error: any) {
      console.error("Error adding track:", error);
      toast({
        title: "Error",
        description:
          error?.message ||
          "An unexpected error occurred while adding the track",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 relative min-h-[400px] flex flex-col"
    >
      <div className="space-y-4 flex-1">
        <div className="space-y-2">
          <Label htmlFor="name">Track Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter track name"
            required
          />
        </div>

        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant={useAddress ? "default" : "outline"}
            onClick={() => setUseAddress(true)}
          >
            Use Address
          </Button>
          <Button
            type="button"
            variant={!useAddress ? "default" : "outline"}
            onClick={() => setUseAddress(false)}
          >
            Use Coordinates
          </Button>
        </div>

        {useAddress ? (
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <div className="relative">
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter track address"
                required
              />
              {showSuggestions && suggestions.length > 0 && (
                <div
                  className="absolute z-[9999] w-full bg-background border rounded-md shadow-lg overflow-y-auto"
                  style={{
                    maxHeight: "300px",
                    top: "calc(100% + 4px)",
                  }}
                >
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-accent rounded-md flex items-center gap-2"
                      onClick={() => selectAddress(suggestion)}
                    >
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate">
                        {suggestion.display_name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="Enter latitude"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="Enter longitude"
                required
              />
            </div>
          </div>
        )}
      </div>

      <Button type="submit" className="w-full mt-auto" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Adding Track...
          </>
        ) : (
          "Add Track"
        )}
      </Button>
    </form>
  );
}
