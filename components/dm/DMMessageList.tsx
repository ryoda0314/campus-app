"use client";

import { useRef, useEffect } from "react";
import { DMMessage } from "@/lib/types/chat";
import { DMMessageItem } from "./DMMessageItem";
import { Loader2 } from "lucide-react";

interface DMMessageListProps {
    messages: DMMessage[];
    loading: boolean;
    loadingMore?: boolean;
    hasMore?: boolean;
    currentUserId: string;
    onLoadMore?: () => void;
    onEdit?: (messageId: string, newContent: string) => void;
    onDelete?: (messageId: string) => void;
    onReactionChange?: () => void;
}

export function DMMessageList({
    messages,
    loading,
    loadingMore,
    hasMore,
    currentUserId,
    onLoadMore,
    onEdit,
    onDelete,
    onReactionChange,
}: DMMessageListProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const isNearBottomRef = useRef(true);
    const prevLengthRef = useRef(messages.length);
    const initialScrollDoneRef = useRef(false);

    const checkNearBottom = () => {
        if (!containerRef.current) return true;
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        return scrollHeight - scrollTop - clientHeight < 100;
    };

    const scrollToBottom = (smooth = true) => {
        bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    };

    const handleScroll = () => {
        if (!containerRef.current) return;

        isNearBottomRef.current = checkNearBottom();

        if (containerRef.current.scrollTop < 50 && hasMore && !loadingMore && onLoadMore) {
            onLoadMore();
        }
    };

    useEffect(() => {
        if (messages.length > prevLengthRef.current && isNearBottomRef.current) {
            scrollToBottom();
        }
        prevLengthRef.current = messages.length;
    }, [messages.length]);

    useEffect(() => {
        if (!loading && messages.length > 0 && !initialScrollDoneRef.current) {
            scrollToBottom(false);
            initialScrollDoneRef.current = true;
        }
    }, [loading, messages.length]);

    // Reset initial scroll flag when conversation changes
    useEffect(() => {
        initialScrollDoneRef.current = false;
    }, []);

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
            className="flex-1 overflow-y-auto"
            onScroll={handleScroll}
        >
            {loadingMore && (
                <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
            )}

            <div className="divide-y divide-border/50">
                {messages.map((message) => (
                    <DMMessageItem
                        key={message.id}
                        message={message}
                        currentUserId={currentUserId}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onReactionChange={onReactionChange}
                    />
                ))}
            </div>

            <div ref={bottomRef} />
        </div>
    );
}
