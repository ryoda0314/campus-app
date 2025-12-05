"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Languages, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface TranslateButtonProps {
    text: string;
    messageId: string;
}

// Cache translations to avoid re-fetching
const translationCache = new Map<string, string>();

export function TranslateButton({ text, messageId }: TranslateButtonProps) {
    const [translation, setTranslation] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const cacheKey = `${messageId}:ja`; // Default to Japanese

    const handleTranslate = async () => {
        // Check cache first
        if (translationCache.has(cacheKey)) {
            setTranslation(translationCache.get(cacheKey) || null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/chat/translate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text,
                    targetLanguage: "ja",
                }),
            });

            if (!res.ok) throw new Error("Translation failed");

            const data = await res.json();
            translationCache.set(cacheKey, data.translated);
            setTranslation(data.translated);
        } catch (err) {
            console.error("Translation error:", err);
            setError("翻訳に失敗しました");
        } finally {
            setLoading(false);
        }
    };

    if (!text) return null;

    return (
        <div className="mt-2">
            {!translation && !loading && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleTranslate}
                    className="h-6 text-xs text-muted-foreground hover:text-foreground"
                >
                    <Languages className="h-3 w-3 mr-1" />
                    翻訳
                </Button>
            )}

            {loading && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground py-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    翻訳中...
                </div>
            )}

            {error && (
                <p className="text-xs text-destructive py-1">{error}</p>
            )}

            {translation && (
                <div className="border-l-2 border-primary/30 pl-2 mt-1">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                        <Languages className="h-3 w-3" />
                        翻訳
                        {expanded ? (
                            <ChevronUp className="h-3 w-3" />
                        ) : (
                            <ChevronDown className="h-3 w-3" />
                        )}
                    </button>
                    {expanded && (
                        <p className="text-sm mt-1 text-muted-foreground">
                            {translation}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
