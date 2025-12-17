"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Loader2 } from "lucide-react";
import { NewsCategory } from "@/lib/types/news";

const CATEGORIES: { value: NewsCategory; label: string }[] = [
    { value: "notice", label: "お知らせ" },
    { value: "event", label: "イベント" },
    { value: "recruit", label: "募集" },
    { value: "lost", label: "落とし物" },
    { value: "study", label: "学習" },
];

interface CreateNewsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function CreateNewsDialog({ open, onOpenChange, onSuccess }: CreateNewsDialogProps) {
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [category, setCategory] = useState<NewsCategory>("notice");
    const [expiresAt, setExpiresAt] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!title.trim()) {
            setError("タイトルを入力してください");
            return;
        }

        if (title.length > 120) {
            setError("タイトルは120文字以内で入力してください");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/news", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim(),
                    body: body.trim() || null,
                    category,
                    visibility: "public",
                    expires_at: expiresAt || null,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "投稿に失敗しました");
            }

            // Reset form
            setTitle("");
            setBody("");
            setCategory("notice");
            setExpiresAt("");

            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : "投稿に失敗しました");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>ニュースを投稿</DialogTitle>
                        <DialogDescription>
                            学内のみんなに向けてニュースを投稿します
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Category */}
                        <div className="space-y-2">
                            <Label>カテゴリ</Label>
                            <Select value={category} onValueChange={(v) => setCategory(v as NewsCategory)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="カテゴリを選択" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map((c) => (
                                        <SelectItem key={c.value} value={c.value}>
                                            {c.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title">タイトル *</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="例: 今週末の勉強会のお知らせ"
                                maxLength={120}
                            />
                            <p className="text-xs text-muted-foreground text-right">
                                {title.length}/120
                            </p>
                        </div>

                        {/* Body */}
                        <div className="space-y-2">
                            <Label htmlFor="body">本文</Label>
                            <Textarea
                                id="body"
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder="詳細を入力..."
                                rows={5}
                            />
                        </div>

                        {/* Expires At */}
                        <div className="space-y-2">
                            <Label htmlFor="expires">締切日（任意）</Label>
                            <Input
                                id="expires"
                                type="datetime-local"
                                value={expiresAt}
                                onChange={(e) => setExpiresAt(e.target.value)}
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            キャンセル
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            投稿する
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
