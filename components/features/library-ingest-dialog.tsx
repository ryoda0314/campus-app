"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, Sparkles, Check, X, FileText, Link, ClipboardPaste, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useLibrary } from "@/hooks/library/useLibrary";
import { useTags } from "@/hooks/library/useTags";
import { TransformResult, TagOrigin, InputType } from "@/lib/types/library";
import { ContentRenderer } from "@/components/features/content-renderer";

interface LibraryIngestDialogProps {
    userId: string;
    onCreated?: () => void;
}

export function LibraryIngestDialog({ userId, onCreated }: LibraryIngestDialogProps) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<"input" | "extracting" | "transforming" | "review" | "saving">("input");
    const [inputType, setInputType] = useState<InputType>("paste");
    const [rawText, setRawText] = useState("");
    const [sourceUrl, setSourceUrl] = useState("");
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfPageCount, setPdfPageCount] = useState<number | null>(null);
    const [transformResult, setTransformResult] = useState<TransformResult | null>(null);
    const [acceptedNewTags, setAcceptedNewTags] = useState<string[]>([]);
    const [personalNote, setPersonalNote] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { createSource, createItem, transformText } = useLibrary(userId);
    const { tagNames, findTagsByNames, createTag } = useTags();

    // Reset when dialog closes
    useEffect(() => {
        if (!open) {
            setStep("input");
            setRawText("");
            setSourceUrl("");
            setPdfFile(null);
            setPdfPageCount(null);
            setTransformResult(null);
            setAcceptedNewTags([]);
            setPersonalNote("");
            setError(null);
            setIsDragging(false);
        }
    }, [open]);

    // Handle PDF file selection
    const handleFileSelect = useCallback(async (file: File) => {
        if (file.type !== "application/pdf") {
            setError("Please select a PDF file");
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setError("File size exceeds 10MB limit");
            return;
        }

        setPdfFile(file);
        setError(null);
    }, []);

    // Handle file input change
    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    // Handle drag and drop
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    // Extract text from PDF
    const handlePdfExtract = async () => {
        if (!pdfFile) {
            setError("Please select a PDF file");
            return;
        }

        setStep("extracting");
        setError(null);

        try {
            const formData = new FormData();
            formData.append("file", pdfFile);

            const response = await fetch("/api/library/pdf-extract", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (data.success && data.text) {
                setRawText(data.text);
                setPdfPageCount(data.pageCount || null);
                // Automatically proceed to transform
                handleTransformWithText(data.text);
            } else {
                setError(data.error || "Failed to extract text from PDF");
                setStep("input");
            }
        } catch (err) {
            console.error("PDF extract error:", err);
            setError("Failed to extract text from PDF");
            setStep("input");
        }
    };

    // Transform text (shared logic)
    const handleTransformWithText = async (text: string) => {
        setStep("transforming");
        setError(null);

        const response = await transformText(text, tagNames, sourceUrl || undefined);

        if (response.success && response.result) {
            setTransformResult(response.result);
            setAcceptedNewTags(response.result.tags.propose_new || []);
            setStep("review");
        } else {
            setError(response.error || "Transform failed");
            setStep("input");
        }
    };

    const handleTransform = async () => {
        if (!rawText.trim()) {
            setError("Please enter some text");
            return;
        }
        await handleTransformWithText(rawText);
    };

    const handleSave = async () => {
        if (!transformResult) return;

        setStep("saving");
        setError(null);

        try {
            // 1. Create source
            const source = await createSource({
                input_type: inputType,
                url: inputType === "url" ? sourceUrl : undefined,
                raw_text: rawText,
            });

            // 2. Create new tags for accepted proposals
            const newTagIds: { tag_id: string; origin: TagOrigin }[] = [];
            for (const tagName of acceptedNewTags) {
                const namespace = tagName.startsWith("entity:") ? "entity" : "topic";
                const newTag = await createTag({
                    name: tagName,
                    namespace,
                });
                if (newTag) {
                    newTagIds.push({ tag_id: newTag.id, origin: "ai_new" });
                }
            }

            // 3. Find existing tag IDs
            const existingTags = findTagsByNames(transformResult.tags.assign_existing);
            const existingTagIds = existingTags.map(t => ({
                tag_id: t.id,
                origin: "ai_existing" as TagOrigin,
            }));

            // 4. Create library item
            await createItem({
                source_id: source?.id,
                title: transformResult.title,
                tldr: transformResult.tldr,
                sections: transformResult.sections,
                personal_note: personalNote || undefined,
                tag_ids: [...existingTagIds, ...newTagIds],
            });

            setOpen(false);
            onCreated?.();
        } catch (err) {
            console.error("Save error:", err);
            setError("Failed to save");
            setStep("review");
        }
    };

    const toggleNewTag = (tag: string) => {
        setAcceptedNewTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Add to Library
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {step === "input" && "Add Knowledge"}
                        {step === "extracting" && "Extracting text from PDF..."}
                        {step === "transforming" && "Transforming..."}
                        {step === "review" && "Review & Save"}
                        {step === "saving" && "Saving..."}
                    </DialogTitle>
                </DialogHeader>

                {/* Step: Input */}
                {step === "input" && (
                    <div className="space-y-4">
                        {/* Input Type Tabs */}
                        <div className="flex gap-2">
                            <Button
                                variant={inputType === "paste" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setInputType("paste")}
                                className="gap-2"
                            >
                                <ClipboardPaste className="h-4 w-4" />
                                Paste
                            </Button>
                            <Button
                                variant={inputType === "url" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setInputType("url")}
                                className="gap-2"
                            >
                                <Link className="h-4 w-4" />
                                URL
                            </Button>
                            <Button
                                variant={inputType === "pdf" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setInputType("pdf")}
                                className="gap-2"
                            >
                                <FileText className="h-4 w-4" />
                                PDF
                            </Button>
                        </div>

                        {/* URL Input */}
                        {inputType === "url" && (
                            <div>
                                <label className="text-sm font-medium">Source URL</label>
                                <input
                                    type="url"
                                    placeholder="https://..."
                                    value={sourceUrl}
                                    onChange={(e) => setSourceUrl(e.target.value)}
                                    className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                />
                                <p className="mt-1 text-xs text-muted-foreground">
                                    URL will be saved as reference. Please paste the content below.
                                </p>
                            </div>
                        )}

                        {/* PDF Upload */}
                        {inputType === "pdf" && (
                            <div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,application/pdf"
                                    onChange={handleFileInputChange}
                                    className="hidden"
                                />
                                <div
                                    className={`
                                        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                                        transition-colors
                                        ${isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/30 hover:border-primary/50"}
                                        ${pdfFile ? "bg-muted/30" : ""}
                                    `}
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    {pdfFile ? (
                                        <div className="space-y-2">
                                            <FileText className="h-10 w-10 mx-auto text-primary" />
                                            <p className="font-medium">{pdfFile.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPdfFile(null);
                                                }}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground">
                                                Drag & drop a PDF or click to select
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Max 10MB
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Text Input (for paste and url) */}
                        {(inputType === "paste" || inputType === "url") && (
                            <div>
                                <label className="text-sm font-medium">Content</label>
                                <textarea
                                    placeholder="Paste the text content here..."
                                    value={rawText}
                                    onChange={(e) => setRawText(e.target.value)}
                                    rows={10}
                                    className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
                                />
                            </div>
                        )}

                        {error && (
                            <div className="text-sm text-red-500">{error}</div>
                        )}

                        {inputType === "pdf" ? (
                            <Button
                                onClick={handlePdfExtract}
                                disabled={!pdfFile}
                                className="w-full gap-2"
                            >
                                <Sparkles className="h-4 w-4" />
                                Extract & Transform
                            </Button>
                        ) : (
                            <Button
                                onClick={handleTransform}
                                disabled={!rawText.trim()}
                                className="w-full gap-2"
                            >
                                <Sparkles className="h-4 w-4" />
                                Transform
                            </Button>
                        )}
                    </div>
                )}

                {/* Step: Extracting */}
                {step === "extracting" && (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="text-muted-foreground">Extracting text from PDF...</p>
                    </div>
                )}

                {/* Step: Transforming */}
                {step === "transforming" && (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="text-muted-foreground">AI is extracting knowledge...</p>
                        {pdfPageCount && (
                            <p className="text-xs text-muted-foreground">
                                Processed {pdfPageCount} pages
                            </p>
                        )}
                    </div>
                )}

                {/* Step: Review */}
                {step === "review" && transformResult && (
                    <div className="space-y-4">
                        {/* Title */}
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">TITLE</label>
                            <p className="font-medium">{transformResult.title}</p>
                        </div>

                        {/* TL;DR */}
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">TL;DR</label>
                            <p className="text-sm">{transformResult.tldr}</p>
                        </div>

                        {/* Sections (AI generated) */}
                        {transformResult.sections.map((section, i) => (
                            <div key={i}>
                                <label className="text-xs font-medium text-muted-foreground uppercase">
                                    {section.heading}
                                </label>
                                <ContentRenderer content={section.content} />
                            </div>
                        ))}

                        {/* Assigned Tags */}
                        {transformResult.tags.assign_existing.length > 0 && (
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">TAGS (existing)</label>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {transformResult.tags.assign_existing.map(tag => (
                                        <Badge key={tag} variant="secondary" className="text-xs">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Proposed New Tags */}
                        {transformResult.tags.propose_new.length > 0 && (
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">
                                    NEW TAGS (click to accept/reject)
                                </label>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {transformResult.tags.propose_new.map(tag => (
                                        <Badge
                                            key={tag}
                                            variant={acceptedNewTags.includes(tag) ? "default" : "outline"}
                                            className="text-xs cursor-pointer gap-1"
                                            onClick={() => toggleNewTag(tag)}
                                        >
                                            {acceptedNewTags.includes(tag) ? (
                                                <Check className="h-3 w-3" />
                                            ) : (
                                                <X className="h-3 w-3" />
                                            )}
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Personal Note */}
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">PERSONAL NOTE (optional)</label>
                            <textarea
                                placeholder="Add your own notes..."
                                value={personalNote}
                                onChange={(e) => setPersonalNote(e.target.value)}
                                rows={2}
                                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
                            />
                        </div>

                        {error && (
                            <div className="text-sm text-red-500">{error}</div>
                        )}

                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setStep("input")} className="flex-1">
                                Back
                            </Button>
                            <Button onClick={handleSave} className="flex-1 gap-2">
                                <Check className="h-4 w-4" />
                                Save to Library
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step: Saving */}
                {step === "saving" && (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="text-muted-foreground">Saving to library...</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
