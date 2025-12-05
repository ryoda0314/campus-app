"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { SmilePlus } from "lucide-react";
import { ReactionGroup } from "@/lib/types/chat";

const COMMON_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🎉", "🔥", "👏"];

interface ReactionsBarProps {
    reactions: ReactionGroup[];
    onToggle: (emoji: string) => void;
    disabled?: boolean;
}

export function ReactionsBar({ reactions, onToggle, disabled }: ReactionsBarProps) {
    const [open, setOpen] = useState(false);

    const handleSelect = (emoji: string) => {
        onToggle(emoji);
        setOpen(false);
    };

    return (
        <div className="flex items-center gap-1 flex-wrap mt-1">
            {/* Existing reactions */}
            {reactions.map((r) => (
                <button
                    key={r.emoji}
                    onClick={() => onToggle(r.emoji)}
                    disabled={disabled}
                    className={`
                        inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
                        transition-colors border
                        ${r.hasReacted
                            ? "bg-primary/20 border-primary/50 text-primary"
                            : "bg-muted/50 border-border hover:bg-muted"
                        }
                        disabled:opacity-50
                    `}
                >
                    <span>{r.emoji}</span>
                    <span className="font-medium">{r.count}</span>
                </button>
            ))}

            {/* Add reaction button */}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={disabled}
                    >
                        <SmilePlus className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="start">
                    <div className="flex gap-1 flex-wrap max-w-[200px]">
                        {COMMON_EMOJIS.map((emoji) => (
                            <button
                                key={emoji}
                                onClick={() => handleSelect(emoji)}
                                className="p-2 hover:bg-muted rounded text-lg transition-colors"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
