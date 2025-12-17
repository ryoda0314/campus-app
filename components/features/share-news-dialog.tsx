"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageCircle, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ShareNewsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    newsTitle: string;
    newsUrl?: string;
    newsId: string;
    newsType: "campus" | "digest";
}

interface Room {
    id: string;
    name: string;
}

interface DMConversation {
    id: string;
    participant: {
        display_name: string;
    };
}

export function ShareNewsDialog({
    open,
    onOpenChange,
    newsTitle,
    newsUrl,
    newsId,
    newsType,
}: ShareNewsDialogProps) {
    const [shareType, setShareType] = useState<"room" | "dm">("room");
    const [rooms, setRooms] = useState<Room[]>([]);
    const [dmConversations, setDmConversations] = useState<DMConversation[]>([]);
    const [selectedId, setSelectedId] = useState<string>("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (open) {
            loadData();
            // Pre-fill message
            const url = newsUrl || `${window.location.origin}/news/${newsId}?type=${newsType}`;
            setMessage(`📰 ${newsTitle}\n\n${url}`);
        }
    }, [open, newsTitle, newsUrl, newsId, newsType]);

    const loadData = async () => {
        setLoadingData(true);

        // Load rooms
        const { data: roomsData } = await supabase
            .from("rooms")
            .select("id, name")
            .order("name");

        if (roomsData) {
            setRooms(roomsData);
        }

        // Load DM conversations
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: dmsData } = await supabase
                .from("dm_conversations")
                .select(`
                    id,
                    participant1_id,
                    participant2_id,
                    participant1:profiles!dm_conversations_participant1_id_fkey(display_name),
                    participant2:profiles!dm_conversations_participant2_id_fkey(display_name)
                `)
                .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`);

            if (dmsData) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const conversations = (dmsData as any[]).map((dm) => ({
                    id: dm.id,
                    participant: dm.participant1_id === user.id ? dm.participant2 : dm.participant1,
                })).filter((dm) => dm.participant);
                setDmConversations(conversations as DMConversation[]);
            }
        }

        setLoadingData(false);
    };

    const handleShare = async () => {
        if (!selectedId || !message.trim()) return;

        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found");

            if (shareType === "room") {
                // Send to room chat
                const { error } = await supabase.from("messages").insert({
                    room_id: selectedId,
                    content: message.trim(),
                    user_id: user.id,
                });
                if (error) throw error;
            } else {
                // Send to DM
                const { error } = await supabase.from("dm_messages").insert({
                    conversation_id: selectedId,
                    content: message.trim(),
                    sender_id: user.id,
                });
                if (error) throw error;
            }

            onOpenChange(false);
            setSelectedId("");
            setMessage("");
        } catch (error) {
            console.error("Share failed:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>ニュースを共有</DialogTitle>
                    <DialogDescription>
                        ルームまたはDMでニュースを共有します
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {loadingData ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* Share Type */}
                            <div className="space-y-2">
                                <Label>共有先</Label>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant={shareType === "room" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => {
                                            setShareType("room");
                                            setSelectedId("");
                                        }}
                                        className="gap-2"
                                    >
                                        <Users className="h-4 w-4" />
                                        Room
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={shareType === "dm" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => {
                                            setShareType("dm");
                                            setSelectedId("");
                                        }}
                                        className="gap-2"
                                    >
                                        <MessageCircle className="h-4 w-4" />
                                        DM
                                    </Button>
                                </div>
                            </div>

                            {/* Select Target */}
                            <div className="space-y-2">
                                <Label>{shareType === "room" ? "ルーム" : "送信先"}</Label>
                                <Select value={selectedId} onValueChange={setSelectedId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={shareType === "room" ? "ルームを選択" : "相手を選択"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {shareType === "room" ? (
                                            rooms.length > 0 ? (
                                                rooms.map((room) => (
                                                    <SelectItem key={room.id} value={room.id}>
                                                        {room.name}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="none" disabled>
                                                    ルームがありません
                                                </SelectItem>
                                            )
                                        ) : (
                                            dmConversations.length > 0 ? (
                                                dmConversations.map((dm) => (
                                                    <SelectItem key={dm.id} value={dm.id}>
                                                        {dm.participant.display_name}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="none" disabled>
                                                    DMがありません
                                                </SelectItem>
                                            )
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Message */}
                            <div className="space-y-2">
                                <Label>メッセージ</Label>
                                <Textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={4}
                                />
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        キャンセル
                    </Button>
                    <Button
                        onClick={handleShare}
                        disabled={loading || !selectedId || !message.trim()}
                    >
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        送信
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
