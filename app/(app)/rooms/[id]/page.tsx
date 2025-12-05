import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MoreVertical, LogOut } from "lucide-react";
import { ActivityRank } from "@/components/features/activity-rank";
import { RoomChat } from "@/components/features/room-chat";
import { RoomMembers } from "@/components/features/room-members";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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

    // Auto-join user to room if not already a member
    const { data: existingMember } = await supabase
        .from("room_members")
        .select("user_id")
        .eq("room_id", id)
        .eq("user_id", user.id)
        .single();

    if (!existingMember) {
        await supabase.from("room_members").insert({
            room_id: id,
            user_id: user.id,
        });
    }

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
                    </div>
                </div>

                {/* Chat Component */}
                <RoomChat roomId={id} currentUserId={user.id} />
            </div>

            {/* Sidebar (Members) */}
            <div className="hidden w-72 flex-col gap-4 lg:flex">
                <RoomMembers roomId={id} />
            </div>
        </div>
    );
}

