"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, X, MoreVertical, Settings, LogOut } from "lucide-react";
import { RoomChat } from "@/components/chat";
import { useRoomMembers } from "@/hooks/useRooms";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RoomContentProps {
    roomId: string;
    currentUserId: string;
    roomName: string;
    roomDescription: string | null;
}

export function RoomContent({ roomId, currentUserId, roomName, roomDescription }: RoomContentProps) {
    const [showSearch, setShowSearch] = useState(false);
    const { leaveRoom } = useRoomMembers(roomId);
    const router = useRouter();

    return (
        <div className="flex h-full gap-4">
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

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Room Settings</DropdownMenuLabel>
                            <DropdownMenuItem>
                                <Settings className="h-4 w-4 mr-2" />
                                Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={async () => {
                                    if (confirm("Are you sure you want to leave this room?")) {
                                        await leaveRoom();
                                        router.push("/rooms");
                                    }
                                }}
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Leave Room
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Chat Component */}
                <RoomChat
                    roomId={roomId}
                    currentUserId={currentUserId}
                    showSearch={showSearch}
                    onCloseSearch={() => setShowSearch(false)}
                />
            </div>
        </div>
    );
}
