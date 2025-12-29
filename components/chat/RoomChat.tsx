"use client";

import { useState, useCallback } from "react";
import { useRoomMessages } from "@/hooks/chat";
import { Message } from "@/lib/types/chat";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { SearchPanel } from "./SearchPanel";
import { ThreadView } from "./ThreadView";

interface RoomChatProps {
    roomId: string;
    currentUserId: string;
    showSearch?: boolean;
    onCloseSearch?: () => void;
}

export function RoomChat({ roomId, currentUserId, showSearch = false, onCloseSearch }: RoomChatProps) {
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
    } = useRoomMessages(roomId);

    // Thread view state
    const [activeThread, setActiveThread] = useState<Message | null>(null);

    // Handle open thread
    const handleOpenThread = useCallback((message: Message) => {
        setActiveThread(message);
        onCloseSearch?.();
    }, [onCloseSearch]);

    // Handle close thread
    const handleCloseThread = useCallback(() => {
        setActiveThread(null);
        refetch(); // Refresh to get updated reply counts
    }, [refetch]);

    // Handle close search panel
    const handleCloseSearch = useCallback(() => {
        onCloseSearch?.();
    }, [onCloseSearch]);

    // Handle send message
    const handleSend = useCallback(async (
        content: string,
        attachments?: { path: string; width?: number; height?: number; mimeType: string }[]
    ) => {
        await sendMessage(content, attachments);
    }, [sendMessage]);

    // Handle edit
    const handleEdit = useCallback(async (messageId: string, newContent: string) => {
        await editMessage(messageId, newContent);
        refetch();
    }, [editMessage, refetch]);

    // Handle delete
    const handleDelete = useCallback(async (messageId: string) => {
        if (confirm("このメッセージを削除しますか？")) {
            await deleteMessage(messageId);
            refetch();
        }
    }, [deleteMessage, refetch]);

    // Handle reaction change - no need to refetch, realtime handles it
    const handleReactionChange = useCallback(() => {
        // Reactions are handled via realtime or optimistic update
        // No refetch needed to avoid screen flash
    }, []);

    // Handle jump to message from search
    const handleJumpToMessage = useCallback((messageId: string) => {
        onCloseSearch?.();
    }, [onCloseSearch]);

    // If thread is active, show thread view
    if (activeThread) {
        return (
            <ThreadView
                rootMessage={activeThread}
                currentUserId={currentUserId}
                onBack={handleCloseThread}
            />
        );
    }

    return (
        <div className="flex flex-1 overflow-hidden">
            {/* Main chat area */}
            <div className="flex flex-col flex-1 min-w-0">
                {/* Message list */}
                <MessageList
                    messages={messages}
                    loading={loading}
                    loadingMore={loadingMore}
                    hasMore={hasMore}
                    currentUserId={currentUserId}
                    onLoadMore={loadMore}
                    onOpenThread={handleOpenThread}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onReactionChange={handleReactionChange}
                />

                {/* Message input */}
                <MessageInput
                    roomId={roomId}
                    onSend={handleSend}
                    placeholder="メッセージを入力..."
                />
            </div>

            {/* Right panel (Search only) */}
            {showSearch && (
                <div className="w-80 flex-shrink-0 hidden lg:flex">
                    <SearchPanel
                        roomId={roomId}
                        onClose={handleCloseSearch}
                        onJumpToMessage={handleJumpToMessage}
                    />
                </div>
            )}
        </div>
    );
}
