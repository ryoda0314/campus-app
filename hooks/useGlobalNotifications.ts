"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useGlobalNotifications(currentUserId: string | undefined) {
    const supabase = createClient();
    const [myRoomIds, setMyRoomIds] = useState<Set<string>>(new Set());
    const processedMessageIds = useRef<Set<string>>(new Set());

    // Request permissions
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    // Fetch my rooms
    useEffect(() => {
        if (!currentUserId) return;

        const fetchMyRooms = async () => {
            const { data } = await supabase
                .from("room_members")
                .select("room_id")
                .eq("user_id", currentUserId);

            if (data) {
                setMyRoomIds(new Set(data.map(r => r.room_id)));
            }
        };

        fetchMyRooms();
    }, [currentUserId, supabase]);

    // Subscribe to messages
    useEffect(() => {
        if (!currentUserId) return;

        const channel = supabase
            .channel("global-notifications")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                },
                async (payload) => {
                    const newMessage = payload.new;

                    // Filter: Only my rooms, not my own messages
                    if (
                        newMessage.user_id !== currentUserId &&
                        myRoomIds.has(newMessage.room_id) &&
                        !processedMessageIds.current.has(newMessage.id)
                    ) {
                        processedMessageIds.current.add(newMessage.id);

                        // Clean up old IDs
                        if (processedMessageIds.current.size > 100) {
                            processedMessageIds.current.clear();
                        }

                        // Fetch sender name for proper notification
                        const { data: profile } = await supabase
                            .from("profiles")
                            .select("display_name")
                            .eq("id", newMessage.user_id)
                            .single();

                        const senderName = profile?.display_name || "Someone";
                        const notificationTitle = `New message from ${senderName}`;
                        const notificationBody = newMessage.content || "Sent an attachment";

                        if (document.hidden && Notification.permission === "granted") {
                            new Notification(notificationTitle, {
                                body: notificationBody,
                                icon: "/icon-192x192.png", // Assuming PWA icon exists
                                tag: newMessage.room_id // Group by room
                            });
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUserId, myRoomIds, supabase]);
}
