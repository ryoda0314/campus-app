import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, X, MoreVertical, Settings, LogOut, Users, ChevronLeft } from "lucide-react";
import { RoomChat } from "@/components/chat";
import { useRoomMembers } from "@/hooks/useRooms";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ActivityRank } from "@/components/features/activity-rank";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface RoomContentProps {
    roomId: string;
    currentUserId: string;
    roomName: string;
    roomDescription: string | null;
}

export function RoomContent({ roomId, currentUserId, roomName, roomDescription }: RoomContentProps) {
    const [showSearch, setShowSearch] = useState(false);
    const [showMembers, setShowMembers] = useState(false);
    const { members, leaveRoom, memberCount } = useRoomMembers(roomId);
    const router = useRouter();

    return (
        <div className="flex h-full gap-4">
            {/* Main Chat Area */}
            <div className="flex flex-1 flex-col rounded-lg border bg-card shadow-sm overflow-hidden">
                {/* Chat Header with Search */}
                <div className="flex items-center justify-between border-b p-4 bg-card">
                    <div className="flex items-center gap-3">
                        <Link href="/rooms">
                            <Button variant="ghost" size="icon" className="shrink-0">
                                <ChevronLeft className="h-5 w-5" />
                                <span className="sr-only">Back to Rooms</span>
                            </Button>
                        </Link>
                        <div>
                            <h2 className="text-lg font-semibold">{roomName}</h2>
                            {roomDescription && (
                                <p className="text-sm text-muted-foreground">{roomDescription}</p>
                            )}
                        </div>
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
                            <DropdownMenuItem onClick={() => setShowMembers(true)}>
                                <Users className="h-4 w-4 mr-2" />
                                Members
                            </DropdownMenuItem>
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

                <Dialog open={showMembers} onOpenChange={setShowMembers}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Room Members ({memberCount})</DialogTitle>
                        </DialogHeader>
                        <div className="max-h-[60vh] overflow-y-auto space-y-4">
                            {members?.map((member) => (
                                <div key={member.user_id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={member.profiles?.avatar_url || undefined} />
                                            <AvatarFallback>
                                                {member.profiles?.display_name?.[0] || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="text-sm font-medium">
                                                {member.profiles?.display_name || "Anonymous"}
                                            </div>
                                        </div>
                                    </div>
                                    <ActivityRank rank={member.profiles?.activity_rank || 1} size="sm" />
                                </div>
                            ))}
                            {(!members || members.length === 0) && (
                                <div className="text-sm text-muted-foreground text-center py-4">No members loaded.</div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

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
