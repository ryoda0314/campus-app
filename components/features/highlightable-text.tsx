"use client";

import { useState, useCallback, useRef } from "react";
import { Highlight } from "@/lib/types/library";
import { Highlighter, X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface HighlightableTextProps {
    content: string;
    sectionIndex: number;
    highlights: Highlight[];
    onAddHighlight?: (highlight: Omit<Highlight, "id">) => void;
    onRemoveHighlight?: (highlightId: string) => void;
    readOnly?: boolean;
}

const HIGHLIGHT_COLORS = [
    { name: "yellow", class: "bg-yellow-200/70 dark:bg-yellow-500/30", hover: "hover:bg-yellow-300/70" },
    { name: "green", class: "bg-green-200/70 dark:bg-green-500/30", hover: "hover:bg-green-300/70" },
    { name: "pink", class: "bg-pink-200/70 dark:bg-pink-500/30", hover: "hover:bg-pink-300/70" },
    { name: "blue", class: "bg-blue-200/70 dark:bg-blue-500/30", hover: "hover:bg-blue-300/70" },
] as const;

type HighlightColor = typeof HIGHLIGHT_COLORS[number]["name"];

export function HighlightableText({
    content,
    sectionIndex,
    highlights,
    onAddHighlight,
    onRemoveHighlight,
    readOnly = false,
}: HighlightableTextProps) {
    const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [colorPickerPosition, setColorPickerPosition] = useState({ x: 0, y: 0 });
    const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle text selection
    const handleMouseUp = useCallback(() => {
        if (readOnly) return;

        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
            setSelectedRange(null);
            setShowColorPicker(false);
            return;
        }

        const range = selection.getRangeAt(0);
        const container = containerRef.current;

        if (!container || !container.contains(range.commonAncestorContainer)) {
            return;
        }

        // Calculate offset within content
        const preSelectionRange = document.createRange();
        preSelectionRange.selectNodeContents(container);
        preSelectionRange.setEnd(range.startContainer, range.startOffset);
        const start = preSelectionRange.toString().length;

        const selectedText = selection.toString();
        const end = start + selectedText.length;

        if (start !== end) {
            setSelectedRange({ start, end });

            // Position color picker near selection
            const rect = range.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            setColorPickerPosition({
                x: rect.left - containerRect.left + rect.width / 2,
                y: rect.top - containerRect.top - 10,
            });
            setShowColorPicker(true);
        }
    }, [readOnly]);

    // Add highlight with selected color
    const handleAddHighlight = (color: HighlightColor) => {
        if (!selectedRange || !onAddHighlight) return;

        onAddHighlight({
            section_index: sectionIndex,
            start: selectedRange.start,
            end: selectedRange.end,
            color,
        });

        setSelectedRange(null);
        setShowColorPicker(false);
        window.getSelection()?.removeAllRanges();
    };

    // Handle clicking on existing highlight
    const handleHighlightClick = (highlight: Highlight, event: React.MouseEvent) => {
        if (readOnly) return;
        event.stopPropagation();
        setSelectedHighlight(highlight);
    };

    // Render content with highlights applied
    const renderHighlightedContent = () => {
        const sectionHighlights = highlights
            .filter(h => h.section_index === sectionIndex)
            .sort((a, b) => a.start - b.start);

        if (sectionHighlights.length === 0) {
            return <span>{content}</span>;
        }

        const parts: React.ReactNode[] = [];
        let lastEnd = 0;

        sectionHighlights.forEach((highlight, index) => {
            // Add text before highlight
            if (highlight.start > lastEnd) {
                parts.push(
                    <span key={`text-${index}`}>
                        {content.slice(lastEnd, highlight.start)}
                    </span>
                );
            }

            // Add highlighted text
            const colorConfig = HIGHLIGHT_COLORS.find(c => c.name === highlight.color) || HIGHLIGHT_COLORS[0];
            parts.push(
                <Popover key={`highlight-${highlight.id}`}>
                    <PopoverTrigger asChild>
                        <mark
                            className={`${colorConfig.class} ${colorConfig.hover} cursor-pointer rounded px-0.5 transition-colors`}
                            onClick={(e) => handleHighlightClick(highlight, e)}
                        >
                            {content.slice(highlight.start, highlight.end)}
                        </mark>
                    </PopoverTrigger>
                    {!readOnly && (
                        <PopoverContent className="w-auto p-2">
                            <div className="flex items-center gap-2">
                                {highlight.note && (
                                    <span className="text-sm text-muted-foreground max-w-[200px] truncate">
                                        {highlight.note}
                                    </span>
                                )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2"
                                    onClick={() => onRemoveHighlight?.(highlight.id)}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        </PopoverContent>
                    )}
                </Popover>
            );

            lastEnd = highlight.end;
        });

        // Add remaining text
        if (lastEnd < content.length) {
            parts.push(
                <span key="text-end">
                    {content.slice(lastEnd)}
                </span>
            );
        }

        return <>{parts}</>;
    };

    return (
        <div className="relative">
            <div
                ref={containerRef}
                className="whitespace-pre-wrap text-sm select-text"
                onMouseUp={handleMouseUp}
            >
                {renderHighlightedContent()}
            </div>

            {/* Color picker popup */}
            {showColorPicker && !readOnly && (
                <div
                    className="absolute z-50 flex gap-1 p-1.5 bg-popover border rounded-lg shadow-lg"
                    style={{
                        left: `${colorPickerPosition.x}px`,
                        top: `${colorPickerPosition.y}px`,
                        transform: "translate(-50%, -100%)",
                    }}
                >
                    <Highlighter className="h-4 w-4 text-muted-foreground mr-1" />
                    {HIGHLIGHT_COLORS.map((color) => (
                        <button
                            key={color.name}
                            className={`w-6 h-6 rounded-full ${color.class} border-2 border-transparent hover:border-foreground/30 transition-all`}
                            onClick={() => handleAddHighlight(color.name as HighlightColor)}
                            title={color.name}
                        />
                    ))}
                    <button
                        className="ml-1 p-1 hover:bg-muted rounded"
                        onClick={() => {
                            setShowColorPicker(false);
                            setSelectedRange(null);
                        }}
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            )}
        </div>
    );
}
