"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DMList, DMChat } from "@/components/dm";
import { useDMConversations } from "@/hooks/dm";
import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

interface DMPageContentProps {
    currentUserId: string;
    initialConversationId?: string;
}

export function DMPageContent({ currentUserId, initialConversationId }: DMPageContentProps) {
    const searchParams = useSearchParams();
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
        initialConversationId || null
    );
    const { conversations } = useDMConversations();
    const router = useRouter();

    // Handle conversation from URL param
    useEffect(() => {
        const conversationParam = searchParams.get("conversation");
        if (conversationParam) {
            setSelectedConversationId(conversationParam);
        }
    }, [searchParams]);

    // Find selected conversation to get other user info
    const selectedConversation = conversations.find(c => c.id === selectedConversationId);

    const handleSelectConversation = (conversationId: string) => {
        setSelectedConversationId(conversationId);
    };

    const handleBack = () => {
        setSelectedConversationId(null);
    };

    return (
        <div className="h-[calc(100vh-4rem)]">
            <div className="flex h-full gap-4">
                {/* Conversation list - hidden on mobile when conversation selected */}
                <Card className={`w-80 flex-shrink-0 overflow-hidden ${selectedConversationId ? "hidden lg:block" : "block"
                    }`}>
                    <div className="h-full flex flex-col">
                        <div className="px-4 py-3 border-b">
                            <h2 className="font-semibold">ダイレクトメッセージ</h2>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <DMList
                                onSelectConversation={handleSelectConversation}
                                selectedConversationId={selectedConversationId}
                            />
                        </div>
                    </div>
                </Card>

                {/* Chat area */}
                <Card className={`flex-1 overflow-hidden ${selectedConversationId ? "block" : "hidden lg:block"
                    }`}>
                    {selectedConversationId ? (
                        <DMChat
                            conversationId={selectedConversationId}
                            currentUserId={currentUserId}
                            otherUser={selectedConversation?.other_user}
                            onBack={handleBack}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <MessageSquare className="h-16 w-16 mb-4" />
                            <p>会話を選択してください</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
