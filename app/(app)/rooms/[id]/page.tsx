import { RoomContent } from "@/components/features/room-content";
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
        .maybeSingle();

    const isNewMember = !existingMember;

    if (isNewMember) {
        // Insert member
        await supabase.from("room_members").insert({
            room_id: id,
            user_id: user.id,
        });

        // Fetch profile for display name
        const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", user.id)
            .single();

        const displayName = profile?.display_name || "Unknown User";

        // Send system message about joining
        await supabase.from("messages").insert({
            room_id: id,
            kind: "system",
            content: `${displayName} がルームに参加しました`,
        });
    }

    return (
        <RoomContent
            roomId={id}
            currentUserId={user.id}
            roomName={room.name}
            roomDescription={room.description}
        />
    );
}
