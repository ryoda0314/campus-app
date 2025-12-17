"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ContentRendererProps {
    content: string;
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-2 gap-1 text-xs"
        >
            {copied ? (
                <>
                    <Check className="h-3 w-3 text-green-500" />
                    Copied
                </>
            ) : (
                <>
                    <Copy className="h-3 w-3" />
                    Copy
                </>
            )}
        </Button>
    );
}

export function ContentRenderer({ content }: ContentRendererProps) {
    return (
        <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Custom table styling
                    table: ({ children }) => (
                        <div className="overflow-x-auto rounded-lg border my-4">
                            <table className="w-full text-sm">
                                {children}
                            </table>
                        </div>
                    ),
                    thead: ({ children }) => (
                        <thead className="bg-muted/50">
                            {children}
                        </thead>
                    ),
                    th: ({ children }) => (
                        <th className="px-4 py-2 text-left font-medium border-b">
                            {children}
                        </th>
                    ),
                    tr: ({ children }) => (
                        <tr className="border-b last:border-b-0 hover:bg-muted/30">
                            {children}
                        </tr>
                    ),
                    td: ({ children }) => (
                        <td className="px-4 py-2">
                            {children}
                        </td>
                    ),
                    // Custom code block with copy button
                    code: ({ className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || "");
                        const codeString = String(children).replace(/\n$/, "");

                        // Check if it's a code block (has language or multi-line)
                        const hasNewlines = codeString.includes("\n");
                        const isCodeBlock = match || hasNewlines || codeString.length > 80;

                        if (!isCodeBlock) {
                            // Inline code
                            return (
                                <code
                                    className="bg-zinc-800 dark:bg-zinc-900 text-orange-400 dark:text-orange-300 px-2 py-1 rounded-md text-sm font-mono border border-zinc-700"
                                    {...props}
                                >
                                    {children}
                                </code>
                            );
                        }

                        // Code block with copy button
                        const language = match?.[1] || "code";
                        return (
                            <div className="relative group rounded-xl overflow-hidden border-2 border-zinc-700 dark:border-zinc-600 my-4 shadow-lg">
                                <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 dark:bg-zinc-900 border-b border-zinc-700">
                                    <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                                        {language}
                                    </span>
                                    <CopyButton text={codeString} />
                                </div>
                                <pre className="p-4 overflow-x-auto bg-zinc-900 dark:bg-black">
                                    <code className="text-sm font-mono text-zinc-100 leading-relaxed whitespace-pre-wrap" {...props}>
                                        {children}
                                    </code>
                                </pre>
                            </div>
                        );
                    },
                    // Custom pre to avoid double wrapping
                    pre: ({ children }) => <>{children}</>,
                    // Custom list styling
                    ul: ({ children }) => (
                        <ul className="list-disc list-inside space-y-1 my-2">
                            {children}
                        </ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="list-decimal list-inside space-y-1 my-2">
                            {children}
                        </ol>
                    ),
                    li: ({ children }) => (
                        <li className="text-sm">
                            {children}
                        </li>
                    ),
                    // Paragraph styling
                    p: ({ children }) => (
                        <p className="text-sm leading-relaxed my-2">
                            {children}
                        </p>
                    ),
                    // Heading styling
                    h1: ({ children }) => (
                        <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="text-lg font-semibold mt-3 mb-2">{children}</h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="text-base font-medium mt-2 mb-1">{children}</h3>
                    ),
                    // Blockquote styling
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-muted-foreground/30 pl-4 my-2 italic text-muted-foreground">
                            {children}
                        </blockquote>
                    ),
                    // Strong and emphasis
                    strong: ({ children }) => (
                        <strong className="font-semibold">{children}</strong>
                    ),
                    em: ({ children }) => (
                        <em className="italic">{children}</em>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
