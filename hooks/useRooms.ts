"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface RoomMember {
    user_id: string;
    profiles: {
        display_name: string | null;
        avatar_url: string | null;
        activity_rank: number | null;
    } | null;
}

interface Room {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    created_by: string;
    member_count?: number;
}

export function useRoomMembers(roomId: string) {
    const [members, setMembers] = useState<RoomMember[]>([]);
    const [memberCount, setMemberCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isMember, setIsMember] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = useMemo(() => createClient(), []);

    const fetchMembers = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Get member count
            const { count, error: countError } = await supabase
                .from("room_members")
                .select("*", { count: "exact", head: true })
                .eq("room_id", roomId);

            if (countError) {
                console.error("Count error:", countError);
            }
            setMemberCount(count || 0);

            // Get member user_ids first
            const { data: memberData, error: memberError } = await supabase
                .from("room_members")
                .select("user_id")
                .eq("room_id", roomId)
                .limit(10);

            console.log("Room members data:", memberData, "Error:", memberError, "roomId:", roomId);

            if (memberError) {
                throw memberError;
            }

            if (memberData && memberData.length > 0) {
                // Then fetch profiles for those users
                const userIds = memberData.map(m => m.user_id);
                const { data: profilesData, error: profilesError } = await supabase
                    .from("profiles")
                    .select("id, display_name, avatar_url, activity_rank")
                    .in("id", userIds);

                if (profilesError) {
                    console.error("Profiles error:", profilesError);
                }

                // Combine member data with profiles
                const membersWithProfiles = memberData.map(member => {
                    const profile = profilesData?.find(p => p.id === member.user_id);
                    return {
                        user_id: member.user_id,
                        profiles: profile ? {
                            display_name: profile.display_name,
                            avatar_url: profile.avatar_url,
                            activity_rank: profile.activity_rank,
                        } : null,
                    };
                });
                setMembers(membersWithProfiles);
            } else {
                setMembers([]);
            }

            // Check if current user is a member
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: membership } = await supabase
                    .from("room_members")
                    .select("user_id")
                    .eq("room_id", roomId)
                    .eq("user_id", user.id)
                    .limit(1);

                setIsMember(!!(membership && membership.length > 0));
            }
        } catch (err) {
            console.error("Failed to fetch members:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch members");
        } finally {
            setLoading(false);
        }
    }, [supabase, roomId]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const joinRoom = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { error } = await supabase
            .from("room_members")
            .insert({
                room_id: roomId,
                user_id: user.id,
            });

        if (!error) {
            setIsMember(true);
            await fetchMembers();
            return true;
        }
        return false;
    };

    const leaveRoom = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { error } = await supabase
            .from("room_members")
            .delete()
            .eq("room_id", roomId)
            .eq("user_id", user.id);

        if (!error) {
            setIsMember(false);
            await fetchMembers();
            return true;
        }
        return false;
    };

    return {
        members,
        memberCount,
        loading,
        isMember,
        joinRoom,
        leaveRoom,
        refetch: fetchMembers,
    };
}

export function useRooms() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = useMemo(() => createClient(), []);
    const [joinedRoomIds, setJoinedRoomIds] = useState<Set<string>>(new Set());

    const fetchRooms = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            // Parallel fetch: Rooms and My Memberships
            const [roomsResult, membershipsResult] = await Promise.all([
                supabase.from("rooms").select("*").order("created_at", { ascending: false }),
                user ? supabase.from("room_members").select("room_id").eq("user_id", user.id) : null
            ]);

            const { data: roomsData, error: fetchError } = roomsResult;

            if (fetchError) throw fetchError;

            // Process Memberships
            if (membershipsResult?.data) {
                setJoinedRoomIds(new Set(membershipsResult.data.map(m => m.room_id)));
            }

            if (roomsData) {
                // Get member counts for each room
                const roomsWithCounts = await Promise.all(
                    roomsData.map(async (room) => {
                        try {
                            const { count } = await supabase
                                .from("room_members")
                                .select("*", { count: "exact", head: true })
                                .eq("room_id", room.id);

                            return { ...room, member_count: count || 0 };
                        } catch {
                            return { ...room, member_count: 0 };
                        }
                    })
                );
                setRooms(roomsWithCounts);
            }
        } catch (err) {
            console.error("Failed to fetch rooms:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch rooms");
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

    return { rooms, joinedRoomIds, loading, error, refetch: fetchRooms };
}
