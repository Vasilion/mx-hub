import { useEffect, useState } from "react";
import {
  Cloud,
  CloudRain,
  CloudSnow,
  Sun,
  Thermometer,
  Droplets,
  Wind,
} from "lucide-react";

interface WeatherData {
  temperature: number;
  precipitation: number;
  windSpeed: number;
  weatherCode: number;
}

interface TrackWeatherProps {
  latitude: string;
  longitude: string;
}

export function TrackWeather({ latitude, longitude }: TrackWeatherProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchWeather() {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,precipitation,wind_speed_10m,weather_code&timezone=auto`
        );
        const data = await response.json();

        setWeather({
          temperature: data.current.temperature_2m,
          precipitation: data.current.precipitation,
          windSpeed: data.current.wind_speed_10m,
          weatherCode: data.current.weather_code,
        });
      } catch (error) {
        console.error("Error fetching weather:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchWeather();
  }, [latitude, longitude]);

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        <span>Loading weather...</span>
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  const getWeatherIcon = (code: number) => {
    if (code >= 0 && code <= 3) return <Sun className="h-4 w-4" />;
    if (code >= 45 && code <= 48) return <Cloud className="h-4 w-4" />;
    if (code >= 51 && code <= 67) return <CloudRain className="h-4 w-4" />;
    if (code >= 71 && code <= 77) return <CloudSnow className="h-4 w-4" />;
    return <Cloud className="h-4 w-4" />;
  };

  const celsiusToFahrenheit = (celsius: number) => {
    return Math.round((celsius * 9) / 5 + 32);
  };

  return (
    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
      <div className="flex items-center">
        {getWeatherIcon(weather.weatherCode)}
        <span className="ml-1">
          {celsiusToFahrenheit(weather.temperature)}°F
        </span>
      </div>
      <div className="flex items-center">
        <Droplets className="h-4 w-4 mr-1" />
        <span>{weather.precipitation}mm</span>
      </div>
      <div className="flex items-center">
        <Wind className="h-4 w-4 mr-1" />
        <span>{weather.windSpeed}km/h</span>
      </div>
    </div>
  );
}
