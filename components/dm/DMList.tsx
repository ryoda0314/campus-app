"use client";

import { useState } from "react";
import { DMConversation } from "@/lib/types/chat";
import { useDMConversations } from "@/hooks/dm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search, Loader2, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

interface DMListProps {
    onSelectConversation: (conversationId: string) => void;
    selectedConversationId?: string | null;
}

export function DMList({ onSelectConversation, selectedConversationId }: DMListProps) {
    const { conversations, loading } = useDMConversations();
    const [searchQuery, setSearchQuery] = useState("");

    const filteredConversations = conversations.filter(conv => {
        if (!searchQuery) return true;
        const name = conv.other_user?.display_name || "";
        return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Search */}
            <div className="p-3 border-b">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ユーザーを検索..."
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Conversations list */}
            <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                            {searchQuery ? "該当するDMがありません" : "まだDMがありません"}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {filteredConversations.map((conv) => (
                            <ConversationItem
                                key={conv.id}
                                conversation={conv}
                                isSelected={selectedConversationId === conv.id}
                                onClick={() => onSelectConversation(conv.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function ConversationItem({
    conversation,
    isSelected,
    onClick,
}: {
    conversation: DMConversation;
    isSelected: boolean;
    onClick: () => void;
}) {
    const timeAgo = conversation.last_message_at
        ? formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true, locale: ja })
        : null;

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-muted/50 ${isSelected ? "bg-primary/10" : ""
                }`}
        >
            <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={conversation.other_user?.avatar_url || undefined} />
                <AvatarFallback>
                    {conversation.other_user?.display_name?.[0] || "U"}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm truncate">
                        {conversation.other_user?.display_name || "Unknown User"}
                    </span>
                    {timeAgo && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                            {timeAgo}
                        </span>
                    )}
                </div>
                {conversation.last_message && (
                    <p className="text-xs text-muted-foreground truncate">
                        {conversation.last_message.content || "画像を送信しました"}
                    </p>
                )}
            </div>
        </button>
    );
}
