"use client";

import { useState, useCallback } from "react";
import { useDMMessages } from "@/hooks/dm";
import { DMMessageList } from "./DMMessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MoreVertical } from "lucide-react";

interface DMChatProps {
    conversationId: string;
    currentUserId: string;
    otherUser?: {
        id: string;
        display_name: string | null;
        avatar_url: string | null;
    } | null;
    onBack?: () => void;
}

export function DMChat({ conversationId, currentUserId, otherUser, onBack }: DMChatProps) {
    const {
        messages,
        loading,
        loadingMore,
        hasMore,
        loadMore,
        sendMessage,
        editMessage,
        deleteMessage,
        refetch,
    } = useDMMessages(conversationId);

    const handleSend = useCallback(async (
        content: string,
        attachments?: { path: string; width?: number; height?: number; mimeType: string }[]
    ) => {
        await sendMessage(content, attachments);
    }, [sendMessage]);

    const handleEdit = useCallback(async (messageId: string, newContent: string) => {
        await editMessage(messageId, newContent);
        refetch();
    }, [editMessage, refetch]);

    const handleDelete = useCallback(async (messageId: string) => {
        if (confirm("このメッセージを削除しますか？")) {
            await deleteMessage(messageId);
            refetch();
        }
    }, [deleteMessage, refetch]);

    const handleReactionChange = useCallback(() => {
        // Reactions handled via realtime
    }, []);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b bg-card">
                {onBack && (
                    <Button variant="ghost" size="icon" onClick={onBack} className="lg:hidden">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                )}
                <Avatar className="h-9 w-9">
                    <AvatarImage src={otherUser?.avatar_url || undefined} />
                    <AvatarFallback>
                        {otherUser?.display_name?.[0] || "U"}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">
                        {otherUser?.display_name || "Unknown User"}
                    </h3>
                </div>
            </div>

            {/* Messages */}
            <DMMessageList
                messages={messages}
                loading={loading}
                loadingMore={loadingMore}
                hasMore={hasMore}
                currentUserId={currentUserId}
                onLoadMore={loadMore}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onReactionChange={handleReactionChange}
            />

            {/* Input */}
            <MessageInput
                roomId={conversationId}
                onSend={handleSend}
                placeholder="メッセージを入力... (Enterで送信)"
            />
        </div>
    );
}
