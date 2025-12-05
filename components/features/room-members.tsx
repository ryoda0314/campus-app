"use client";

import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Loader2 } from "lucide-react";
import { ActivityRank } from "@/components/features/activity-rank";
import { useRoomMembers } from "@/hooks/useRooms";
import { useRouter } from "next/navigation";

interface RoomMembersProps {
    roomId: string;
}

export function RoomMembers({ roomId }: RoomMembersProps) {
    const { members, memberCount, loading, isMember, joinRoom, leaveRoom, refetch } = useRoomMembers(roomId);
    const router = useRouter();
    const hasTriedJoin = useRef(false);

    // Auto-join when entering room (only once)
    useEffect(() => {
        const autoJoin = async () => {
            if (!loading && !isMember && !hasTriedJoin.current) {
                hasTriedJoin.current = true;
                console.log("Auto-joining room...");
                const success = await joinRoom();
                if (success) {
                    await refetch();
                }
            }
        };
        autoJoin();
    }, [loading, isMember, joinRoom, refetch]);

    const handleLeave = async () => {
        const success = await leaveRoom();
        if (success) {
            router.push("/rooms");
        }
    };

    if (loading) {
        return (
            <Card className="flex-1 p-4">
                <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            </Card>
        );
    }

    return (
        <Card className="flex-1 p-4 flex flex-col">
            <h3 className="mb-4 font-semibold">Members ({memberCount})</h3>
            <div className="space-y-4 flex-1">
                {members?.map((member) => (
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
            <div className="mt-4 pt-4 border-t">
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleLeave}
                >
                    <LogOut className="h-4 w-4" />
                    Leave Room
                </Button>
            </div>
        </Card>
    );
}
