"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateAppBadge, clearAppBadge } from "@/lib/appBadge";

const LAST_READ_KEY = "campus_app_last_read_timestamp";

export function useUnreadCount(currentUserId: string | undefined) {
    const [unreadCount, setUnreadCount] = useState(0);
    const [myRoomIds, setMyRoomIds] = useState<Set<string>>(new Set());
    const supabase = createClient();

    // Get timestamp from localStorage
    const getLastReadTime = useCallback((): string => {
        if (typeof window === "undefined") return new Date().toISOString();
        const stored = localStorage.getItem(LAST_READ_KEY);
        return stored || new Date(0).toISOString(); // Unix epoch if never read
    }, []);

    // Save timestamp to localStorage
    const markAsRead = useCallback(() => {
        if (typeof window === "undefined") return;
        const now = new Date().toISOString();
        localStorage.setItem(LAST_READ_KEY, now);
        setUnreadCount(0);
        clearAppBadge();
    }, []);

    // Fetch user's rooms
    useEffect(() => {
        if (!currentUserId) return;

        const fetchMyRooms = async () => {
            const { data } = await supabase
                .from("room_members")
                .select("room_id")
                .eq("user_id", currentUserId);

            if (data) {
                setMyRoomIds(new Set(data.map((r) => r.room_id)));
            }
        };

        fetchMyRooms();
    }, [currentUserId, supabase]);

    // Check initial unread count and subscribe to new messages
    useEffect(() => {
        if (!currentUserId || myRoomIds.size === 0) return;

        const lastReadTime = getLastReadTime();

        // Initial count check
        const fetchInitialCount = async () => {
            const roomIdsArray = Array.from(myRoomIds);
            const { count } = await supabase
                .from("messages")
                .select("*", { count: "exact", head: true })
                .in("room_id", roomIdsArray)
                .neq("user_id", currentUserId)
                .gt("created_at", lastReadTime);

            const unread = count || 0;
            setUnreadCount(unread);
            if (unread > 0) {
                updateAppBadge(unread);
            }
        };

        fetchInitialCount();

        // Realtime subscription
        const channel = supabase
            .channel("unread-count")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                },
                (payload) => {
                    const newMessage = payload.new;
                    if (
                        newMessage.user_id !== currentUserId &&
                        myRoomIds.has(newMessage.room_id)
                    ) {
                        setUnreadCount((prev) => {
                            const newCount = prev + 1;
                            updateAppBadge(newCount);
                            return newCount;
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUserId, myRoomIds, supabase, getLastReadTime]);

    return {
        unreadCount,
        hasUnread: unreadCount > 0,
        markAsRead,
    };
}
