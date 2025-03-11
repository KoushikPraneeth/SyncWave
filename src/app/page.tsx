import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Headphones, Radio } from "lucide-react";

export default function HomePage() {
  return (
    <div className="container mx-auto py-12 px-4 bg-background">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
          Multi-Device Audio Sync
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Transform multiple devices into a synchronized sound system with
          perfect timing alignment
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4">
              <Radio className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Host a Room</CardTitle>
            <CardDescription>
              Create a new audio room and control playback across all connected
              devices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="rounded-full h-5 w-5 flex items-center justify-center bg-primary/10 text-xs">
                  ✓
                </span>
                <span>
                  Select audio from files, microphone, or system audio
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="rounded-full h-5 w-5 flex items-center justify-center bg-primary/10 text-xs">
                  ✓
                </span>
                <span>
                  Control playback and volume for all connected devices
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="rounded-full h-5 w-5 flex items-center justify-center bg-primary/10 text-xs">
                  ✓
                </span>
                <span>Monitor connection quality of all devices</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Link href="/host" className="w-full">
              <Button className="w-full">Host a Room</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4">
              <Headphones className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Join a Room</CardTitle>
            <CardDescription>
              Connect to an existing audio room and receive synchronized audio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="rounded-full h-5 w-5 flex items-center justify-center bg-primary/10 text-xs">
                  ✓
                </span>
                <span>Join by entering a room code or scanning a QR code</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="rounded-full h-5 w-5 flex items-center justify-center bg-primary/10 text-xs">
                  ✓
                </span>
                <span>Adjust your individual device volume</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="rounded-full h-5 w-5 flex items-center justify-center bg-primary/10 text-xs">
                  ✓
                </span>
                <span>View real-time audio visualization and sync status</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Link href="/client" className="w-full">
              <Button className="w-full" variant="outline">
                Join a Room
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
