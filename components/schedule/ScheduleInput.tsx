"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Check, RotateCcw, MapPin, Clock, Calendar } from "lucide-react";
import { ParsedScheduleEvent } from "@/lib/types/schedule";
import { useAddSchedule } from "@/hooks/useSchedule";

interface ScheduleInputProps {
    onEventAdded?: () => void;
}

export function ScheduleInput({ onEventAdded }: ScheduleInputProps) {
    const [text, setText] = useState("");
    const [parsing, setParsing] = useState(false);
    const [parsedEvent, setParsedEvent] = useState<ParsedScheduleEvent | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Editable fields
    const [editedTitle, setEditedTitle] = useState("");
    const [editedDate, setEditedDate] = useState("");
    const [editedTime, setEditedTime] = useState("");
    const [editedLocation, setEditedLocation] = useState("");

    const { addEvent } = useAddSchedule();

    const handleParse = async () => {
        if (!text.trim()) return;

        setParsing(true);
        setError(null);
        setParsedEvent(null);

        try {
            const res = await fetch("/api/schedule/parse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, locale: "ja" }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to parse");
            }

            const event = data.event as ParsedScheduleEvent;
            setParsedEvent(event);

            // Set editable fields
            setEditedTitle(event.title);
            const dt = new Date(event.datetime);
            setEditedDate(dt.toISOString().split("T")[0]);
            setEditedTime(dt.toTimeString().slice(0, 5));
            setEditedLocation(event.location || "");
        } catch (err) {
            setError(err instanceof Error ? err.message : "解析に失敗しました");
        } finally {
            setParsing(false);
        }
    };

    const handleSave = async () => {
        if (!editedTitle || !editedDate || !editedTime) return;

        setSaving(true);
        try {
            const datetime = new Date(`${editedDate}T${editedTime}:00`).toISOString();
            await addEvent({
                title: editedTitle,
                datetime,
                location: editedLocation || null,
                user_id: "", // Will be set by API
            });

            // Reset
            setText("");
            setParsedEvent(null);
            setEditedTitle("");
            setEditedDate("");
            setEditedTime("");
            setEditedLocation("");
            onEventAdded?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : "保存に失敗しました");
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setParsedEvent(null);
        setError(null);
    };

    return (
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <Sparkles className="h-5 w-5 text-primary" />
                    スケジュールを追加
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <AnimatePresence mode="wait">
                    {!parsedEvent ? (
                        <motion.div
                            key="input"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            <Textarea
                                placeholder="予定を自然に入力してください...&#10;例: 来週水曜の15時にミーティング&#10;例: 明日の夜7時に図書館でゼミ作業"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                className="min-h-[100px] resize-none bg-background/50"
                            />
                            {error && (
                                <p className="text-sm text-destructive">{error}</p>
                            )}
                            <Button
                                onClick={handleParse}
                                disabled={!text.trim() || parsing}
                                className="w-full gap-2"
                            >
                                {parsing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        解析中...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4" />
                                        予定を解析する
                                    </>
                                )}
                            </Button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="confirm"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">
                                        タイトル
                                    </label>
                                    <Input
                                        value={editedTitle}
                                        onChange={(e) => setEditedTitle(e.target.value)}
                                        className="bg-background"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            日付
                                        </label>
                                        <Input
                                            type="date"
                                            value={editedDate}
                                            onChange={(e) => setEditedDate(e.target.value)}
                                            className="bg-background"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            時間
                                        </label>
                                        <Input
                                            type="time"
                                            value={editedTime}
                                            onChange={(e) => setEditedTime(e.target.value)}
                                            className="bg-background"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        場所（任意）
                                    </label>
                                    <Input
                                        value={editedLocation}
                                        onChange={(e) => setEditedLocation(e.target.value)}
                                        placeholder="場所を入力..."
                                        className="bg-background"
                                    />
                                </div>
                            </div>
                            {error && (
                                <p className="text-sm text-destructive">{error}</p>
                            )}
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handleReset}
                                    className="flex-1 gap-2"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    やり直す
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={saving || !editedTitle || !editedDate || !editedTime}
                                    className="flex-1 gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            保存中...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4" />
                                            予定を保存
                                        </>
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}
