import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, X } from "lucide-react";

interface Device {
  id: string;
  name: string;
  connectionQuality: "good" | "medium" | "poor" | "disconnected";
  volume: number;
}

interface DeviceListProps {
  devices: Device[];
  onRemoveDevice?: (id: string) => void;
}

export function DeviceList({ devices = [], onRemoveDevice }: DeviceListProps) {
  // If no devices are provided, show some sample devices
  const sampleDevices: Device[] = [
    { id: "1", name: "iPhone 13", connectionQuality: "good", volume: 80 },
    { id: "2", name: "MacBook Pro", connectionQuality: "medium", volume: 65 },
    { id: "3", name: "iPad Air", connectionQuality: "poor", volume: 50 },
  ];

  const displayDevices = devices.length > 0 ? devices : sampleDevices;

  const getConnectionIcon = (quality: Device["connectionQuality"]) => {
    switch (quality) {
      case "good":
        return <Wifi className="h-4 w-4 text-green-500" />;
      case "medium":
        return <Wifi className="h-4 w-4 text-yellow-500" />;
      case "poor":
        return <Wifi className="h-4 w-4 text-red-500" />;
      case "disconnected":
        return <WifiOff className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Wifi className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getConnectionLabel = (quality: Device["connectionQuality"]) => {
    switch (quality) {
      case "good":
        return "Good";
      case "medium":
        return "Medium";
      case "poor":
        return "Poor";
      case "disconnected":
        return "Disconnected";
      default:
        return "Unknown";
    }
  };

  if (displayDevices.length === 0) {
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground">No devices connected</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayDevices.map((device) => (
        <div
          key={device.id}
          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
        >
          <div className="flex items-center gap-2">
            {getConnectionIcon(device.connectionQuality)}
            <div>
              <p className="text-sm font-medium">{device.name}</p>
              <p className="text-xs text-muted-foreground">
                {getConnectionLabel(device.connectionQuality)}
              </p>
            </div>
          </div>
          {onRemoveDevice && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onRemoveDevice(device.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
