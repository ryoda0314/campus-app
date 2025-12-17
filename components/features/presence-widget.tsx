"use client";

import { useState, useEffect, useMemo } from "react";
import { MapPin, Users, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const SPOTS = [
    // Taki Plaza
    "Taki Plaza B2F",
    "Taki Plaza B1F",
    "Taki Plaza 1F",
    "Taki Plaza 2F",
    // Library
    "Library B2F",
    "Library B1F",
    "Library 2F",
    "Library 3F",
    // Other Locations
    "In Class",
    "Lab",
    "Home",
];

interface PresenceUser {
    user_id: string;
    location: string;
    profiles: {
        display_name: string | null;
        avatar_url: string | null;
    } | null;
}

interface PresenceWidgetProps {
    userId: string;
}

export function PresenceWidget({ userId }: PresenceWidgetProps) {
    const [currentSpot, setCurrentSpot] = useState<string>("");
    const [isPublic, setIsPublic] = useState(true);
    const [usersOnCampus, setUsersOnCampus] = useState<PresenceUser[]>([]);
    const supabase = useMemo(() => createClient(), []);

    // Fetch current user's presence and other users on campus
    useEffect(() => {
        const fetchPresence = async () => {
            // Get current user's presence
            const { data: myPresence } = await supabase
                .from("user_presence")
                .select("location, is_public")
                .eq("user_id", userId)
                .single();

            if (myPresence) {
                setCurrentSpot(myPresence.location || "");
                setIsPublic(myPresence.is_public);
            }

            // Get all public users on campus
            const { data: others } = await supabase
                .from("user_presence")
                .select(`
                    user_id,
                    location,
                    profiles (
                        display_name,
                        avatar_url
                    )
                `)
                .eq("is_public", true)
                .not("location", "is", null)
                .neq("location", "");

            if (others) {
                // Transform profiles array to single object
                const transformed = others.map((o: any) => ({
                    ...o,
                    profiles: Array.isArray(o.profiles) ? o.profiles[0] : o.profiles,
                }));
                setUsersOnCampus(transformed);
            }
        };

        fetchPresence();

        // Subscribe to real-time presence changes
        const channel = supabase
            .channel("presence_updates")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "user_presence",
                },
                () => {
                    fetchPresence();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, userId]);

    const updatePresence = async (location: string) => {
        setCurrentSpot(location);
        const newIsPublic = location ? true : false;
        setIsPublic(newIsPublic);

        // Upsert presence
        await supabase.from("user_presence").upsert({
            user_id: userId,
            location: location || null,
            is_public: newIsPublic,
            updated_at: new Date().toISOString(),
        });
    };

    // Group users by location
    const usersByLocation = usersOnCampus.reduce((acc, user) => {
        if (!acc[user.location]) {
            acc[user.location] = [];
        }
        acc[user.location].push(user);
        return acc;
    }, {} as Record<string, PresenceUser[]>);

    const usersAtMySpot = currentSpot ? (usersByLocation[currentSpot] || []).filter(u => u.user_id !== userId) : [];
    const totalUsersOnCampus = usersOnCampus.length;

    return (
        <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        Now on Campus
                    </span>
                    <Badge variant={isPublic && currentSpot ? "default" : "secondary"}>
                        {isPublic && currentSpot ? "Public" : "Hidden"}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-muted-foreground">
                            Your Location
                        </label>
                        <select
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={currentSpot}
                            onChange={(e) => updatePresence(e.target.value)}
                        >
                            <option value="">Not on campus / Hidden</option>
                            {SPOTS.map((spot) => (
                                <option key={spot} value={spot}>
                                    {spot}
                                </option>
                            ))}
                        </select>
                    </div>

                    {currentSpot && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Users here:</span>
                                <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    <span className="font-medium">{usersAtMySpot.length + 1}</span>
                                </div>
                            </div>
                            {usersAtMySpot.length > 0 && (
                                <div className="flex -space-x-2">
                                    {usersAtMySpot.slice(0, 5).map((user) => (
                                        <Link key={user.user_id} href={`/profile/${user.user_id}`}>
                                            <Avatar className="h-8 w-8 border-2 border-background hover:z-10 transition-transform hover:scale-110">
                                                <AvatarImage src={user.profiles?.avatar_url || undefined} />
                                                <AvatarFallback className="text-xs">
                                                    {user.profiles?.display_name?.[0] || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Link>
                                    ))}
                                    {usersAtMySpot.length > 5 && (
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
                                            +{usersAtMySpot.length - 5}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* View All Users Dialog */}
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full gap-2">
                                <Eye className="h-4 w-4" />
                                View All ({totalUsersOnCampus} on campus)
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-primary" />
                                    Users on Campus
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                                {Object.entries(usersByLocation).length === 0 ? (
                                    <p className="text-center text-muted-foreground py-4">
                                        No one is on campus right now.
                                    </p>
                                ) : (
                                    Object.entries(usersByLocation).map(([location, users]) => (
                                        <div key={location} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-medium text-sm">{location}</h4>
                                                <Badge variant="secondary" className="text-xs">
                                                    {users.length} {users.length === 1 ? "user" : "users"}
                                                </Badge>
                                            </div>
                                            <div className="space-y-2">
                                                {users.map((user) => (
                                                    <Link
                                                        key={user.user_id}
                                                        href={`/profile/${user.user_id}`}
                                                        className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors"
                                                    >
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarImage src={user.profiles?.avatar_url || undefined} />
                                                            <AvatarFallback>
                                                                {user.profiles?.display_name?.[0] || "U"}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="text-sm font-medium">
                                                                {user.profiles?.display_name || "Anonymous"}
                                                            </p>
                                                            {user.user_id === userId && (
                                                                <span className="text-xs text-primary">You</span>
                                                            )}
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardContent>
        </Card>
    );
}
