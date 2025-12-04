import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreateRoomDialog } from "@/components/features/create-room-dialog";

export default async function RoomsPage() {
    const supabase = await createClient();
    const { data: rooms } = await supabase.from("rooms").select("*");

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Rooms</h2>
                    <p className="text-muted-foreground">
                        Find a place to work, discuss, or chill.
                    </p>
                </div>
                <CreateRoomDialog />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {rooms?.map((room) => (
                    <Card key={room.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <Badge variant="secondary">{room.category}</Badge>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Users className="h-4 w-4" />
                                    {/* Mock member count */}
                                    {Math.floor(Math.random() * 20) + 1}
                                </div>
                            </div>
                            <CardTitle className="mt-2 text-xl">{room.name}</CardTitle>
                            <CardDescription>{room.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="mt-auto pt-0">
                            <Link href={`/rooms/${room.id}`}>
                                <Button className="w-full gap-2">
                                    Enter Room <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ))}
                {(!rooms || rooms.length === 0) && (
                    <div className="col-span-full text-center text-muted-foreground py-10">
                        No rooms available. Create one to get started!
                    </div>
                )}
            </div>
        </div>
    );
}
