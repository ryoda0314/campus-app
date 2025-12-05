"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageSquare, Loader2 } from "lucide-react";
import { useDMConversations } from "@/hooks/dm";

interface StartDMButtonProps {
    targetUserId: string;
}

export function StartDMButton({ targetUserId }: StartDMButtonProps) {
    const [loading, setLoading] = useState(false);
    const { getOrCreateConversation } = useDMConversations();
    const router = useRouter();

    const handleClick = async () => {
        setLoading(true);
        try {
            const conversationId = await getOrCreateConversation(targetUserId);
            if (conversationId) {
                router.push(`/dm?conversation=${conversationId}`);
            }
        } catch (error) {
            console.error("Failed to start DM:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button onClick={handleClick} disabled={loading}>
            {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
                <MessageSquare className="h-4 w-4 mr-2" />
            )}
            メッセージを送信
        </Button>
    );
}
