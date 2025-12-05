"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { RoomChat } from "@/components/chat";
import { RoomMembers } from "@/components/features/room-members";

interface RoomContentProps {
    roomId: string;
    currentUserId: string;
    roomName: string;
    roomDescription: string | null;
}

export function RoomContent({ roomId, currentUserId, roomName, roomDescription }: RoomContentProps) {
    const [showSearch, setShowSearch] = useState(false);

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-4">
            {/* Main Chat Area */}
            <div className="flex flex-1 flex-col rounded-lg border bg-card shadow-sm overflow-hidden">
                {/* Chat Header with Search */}
                <div className="flex items-center justify-between border-b p-4 bg-card">
                    <div>
                        <h2 className="text-lg font-semibold">{roomName}</h2>
                        {roomDescription && (
                            <p className="text-sm text-muted-foreground">{roomDescription}</p>
                        )}
                    </div>
                    <Button
                        variant={showSearch ? "secondary" : "ghost"}
                        size="icon"
                        onClick={() => setShowSearch(!showSearch)}
                    >
                        {showSearch ? (
                            <X className="h-5 w-5" />
                        ) : (
                            <Search className="h-5 w-5" />
                        )}
                    </Button>
                </div>

                {/* Chat Component */}
                <RoomChat
                    roomId={roomId}
                    currentUserId={currentUserId}
                    showSearch={showSearch}
                    onCloseSearch={() => setShowSearch(false)}
                />
            </div>

            {/* Sidebar (Members) */}
            <div className="hidden w-72 flex-shrink-0 lg:block">
                <RoomMembers roomId={roomId} />
            </div>
        </div>
    );
}
