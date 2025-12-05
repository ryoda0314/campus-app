"use client";

import { useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

export function useReactions() {
    const supabase = useMemo(() => createClient(), []);

    const toggleReaction = useCallback(async (
        emoji: string,
        messageId?: string,
        threadMessageId?: string
    ) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Check if reaction exists
        let query = supabase
            .from("message_reactions")
            .select("id")
            .eq("user_id", user.id)
            .eq("emoji", emoji);

        if (messageId) {
            query = query.eq("message_id", messageId);
        } else if (threadMessageId) {
            query = query.eq("thread_message_id", threadMessageId);
        } else {
            throw new Error("Either messageId or threadMessageId required");
        }

        const { data: existing } = await query.single();

        if (existing) {
            // Remove reaction
            const { error } = await supabase
                .from("message_reactions")
                .delete()
                .eq("id", existing.id);

            if (error) throw error;
            return { added: false };
        } else {
            // Add reaction
            const insertData: any = {
                user_id: user.id,
                emoji,
            };

            if (messageId) {
                insertData.message_id = messageId;
            } else {
                insertData.thread_message_id = threadMessageId;
            }

            const { error } = await supabase
                .from("message_reactions")
                .insert(insertData);

            if (error) throw error;
            return { added: true };
        }
    }, [supabase]);

    return { toggleReaction };
}
