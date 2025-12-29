"use client";

import { useRef, useEffect } from "react";
import { Message } from "@/lib/types/chat";
import { MessageItem } from "./MessageItem";
import { Loader2 } from "lucide-react";

interface MessageListProps {
    messages: Message[];
    loading: boolean;
    loadingMore?: boolean;
    hasMore?: boolean;
    currentUserId: string;
    onLoadMore?: () => void;
    onOpenThread?: (message: Message) => void;
    onEdit?: (messageId: string, newContent: string) => void;
    onDelete?: (messageId: string) => void;
    onReactionChange?: () => void;
}

export function MessageList({
    messages,
    loading,
    loadingMore,
    hasMore,
    currentUserId,
    onLoadMore,
    onOpenThread,
    onEdit,
    onDelete,
    onReactionChange,
}: MessageListProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const isNearBottomRef = useRef(true);
    const prevLengthRef = useRef(messages.length);

    // Check if user is near bottom
    const checkNearBottom = () => {
        if (!containerRef.current) return true;
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        return scrollHeight - scrollTop - clientHeight < 100;
    };

    // Scroll to bottom
    const scrollToBottom = (smooth = true) => {
        bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    };

    // Handle scroll for infinite loading
    const handleScroll = () => {
        if (!containerRef.current) return;

        isNearBottomRef.current = checkNearBottom();

        // Load more when scrolled to top
        if (containerRef.current.scrollTop < 50 && hasMore && !loadingMore && onLoadMore) {
            onLoadMore();
        }
    };

    // Auto-scroll when NEW messages arrive (if near bottom)
    useEffect(() => {
        if (messages.length > prevLengthRef.current && isNearBottomRef.current) {
            scrollToBottom();
        }
        prevLengthRef.current = messages.length;
    }, [messages.length]);

    // Initial scroll to bottom (only once when first loaded)
    const initialScrollDoneRef = useRef(false);
    useEffect(() => {
        if (!loading && messages.length > 0 && !initialScrollDoneRef.current) {
            scrollToBottom(false);
            initialScrollDoneRef.current = true;
        }
    }, [loading, messages.length]);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground text-sm">
                    メッセージはありません。最初のメッセージを送信しましょう！
                </p>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="flex-1 overflow-y-auto overscroll-y-contain"
            onScroll={handleScroll}
        >
            {/* Loading more indicator */}
            {loadingMore && (
                <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
            )}

            {/* Messages */}
            <div className="divide-y divide-border/50">
                {messages.map((message) => (
                    <MessageItem
                        key={message.id}
                        message={message}
                        currentUserId={currentUserId}
                        onOpenThread={onOpenThread}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onReactionChange={onReactionChange}
                    />
                ))}
            </div>

            {/* Scroll anchor */}
            <div ref={bottomRef} />
        </div>
    );
}
