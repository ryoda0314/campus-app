import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreVertical, LogOut } from "lucide-react";
import { ActivityRank } from "@/components/features/activity-rank";
import { RoomChat } from "@/components/features/room-chat";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    // Get current user
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Get room details
    const { data: room } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", id)
        .single();

    if (!room) {
        redirect("/rooms");
    }

    // Get room members (simplified - just count for now)
    const { count: memberCount } = await supabase
        .from("room_members")
        .select("*", { count: "exact", head: true })
        .eq("room_id", id);

    // Get some members for display
    const { data: members } = await supabase
        .from("room_members")
        .select(`
            user_id,
            profiles (
                display_name,
                avatar_url,
                activity_rank
            )
        `)
        .eq("room_id", id)
        .limit(5);

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-6">
            {/* Main Chat Area */}
            <div className="flex flex-1 flex-col rounded-lg border bg-card shadow-sm">
                {/* Chat Header */}
                <div className="flex items-center justify-between border-b p-4">
                    <div>
                        <h2 className="text-lg font-semibold">{room.name}</h2>
                        <p className="text-sm text-muted-foreground">{room.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-5 w-5" />
                        </Button>
                        <Link href="/rooms">
                            <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive">
                                <LogOut className="h-4 w-4" />
                                Leave
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Chat Component */}
                <RoomChat roomId={id} currentUserId={user.id} />
            </div>

            {/* Sidebar (Members) */}
            <div className="hidden w-72 flex-col gap-4 lg:flex">
                <Card className="flex-1 p-4">
                    <h3 className="mb-4 font-semibold">Members ({memberCount || 0})</h3>
                    <div className="space-y-4">
                        {members?.map((member: any) => (
                            <div key={member.user_id} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={member.profiles?.avatar_url || undefined} />
                                        <AvatarFallback>
                                            {member.profiles?.display_name?.[0] || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="text-sm font-medium">
                                            {member.profiles?.display_name || "Anonymous"}
                                        </div>
                                    </div>
                                </div>
                                <ActivityRank rank={member.profiles?.activity_rank || 1} size="sm" />
                            </div>
                        ))}
                        {(!members || members.length === 0) && (
                            <div className="text-sm text-muted-foreground">No members yet.</div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
