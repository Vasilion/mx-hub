import { useEffect, useState } from "react";
import { MapPin, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TrackAddressProps {
  latitude: string;
  longitude: string;
}

export function TrackAddress({ latitude, longitude }: TrackAddressProps) {
  const [address, setAddress] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function getAddress() {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const data = await response.json();
        setAddress(data.display_name);
      } catch (error) {
        console.error("Error fetching address:", error);
        setAddress("Address not found");
      } finally {
        setIsLoading(false);
      }
    }

    getAddress();
  }, [latitude, longitude]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="mr-1 h-4 w-4" />
          <span>Loading address...</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <span>
            Coordinates: {latitude}, {longitude}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground max-w-full">
        <div className="flex items-center min-w-0">
          <MapPin className="mr-1 h-4 w-4 flex-shrink-0" />
          <span className="truncate">{address}</span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="flex-shrink-0">
              <Info className="h-4 w-4 text-muted-foreground/70" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-[200px] text-xs">
                This address is automatically generated from coordinates and may
                not be exact.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="flex items-center text-sm text-muted-foreground">
        <span className="truncate">
          Coordinates: {latitude}, {longitude}
        </span>
      </div>
    </div>
  );
}
