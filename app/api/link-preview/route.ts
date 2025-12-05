import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Simple HTML entity decoder
function decodeHtmlEntities(text: string): string {
    return text
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ");
}

// Extract domain from URL
function extractDomain(url: string): string {
    try {
        const parsed = new URL(url);
        return parsed.hostname.replace(/^www\./, "");
    } catch {
        return "";
    }
}

// Extract OG meta tags from HTML
function extractOgTags(html: string): {
    og_title: string | null;
    og_description: string | null;
    og_image_url: string | null;
} {
    const getMetaContent = (property: string): string | null => {
        // Try og: prefix
        const ogPattern = new RegExp(
            `<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']+)["']`,
            "i"
        );
        const ogMatch = html.match(ogPattern);
        if (ogMatch) return decodeHtmlEntities(ogMatch[1]);

        // Try reverse order (content before property)
        const reversePattern = new RegExp(
            `<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:${property}["']`,
            "i"
        );
        const reverseMatch = html.match(reversePattern);
        if (reverseMatch) return decodeHtmlEntities(reverseMatch[1]);

        return null;
    };

    // Fallback to regular title tag
    const getTitleFallback = (): string | null => {
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        return titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : null;
    };

    // Fallback to meta description
    const getDescriptionFallback = (): string | null => {
        const descPattern = /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i;
        const descMatch = html.match(descPattern);
        if (descMatch) return decodeHtmlEntities(descMatch[1]);

        const reverseDescPattern = /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i;
        const reverseMatch = html.match(reverseDescPattern);
        if (reverseMatch) return decodeHtmlEntities(reverseMatch[1]);

        return null;
    };

    return {
        og_title: getMetaContent("title") || getTitleFallback(),
        og_description: getMetaContent("description") || getDescriptionFallback(),
        og_image_url: getMetaContent("image"),
    };
}

export async function POST(req: NextRequest) {
    try {
        const { url, messageId } = await req.json();

        if (!url) {
            return NextResponse.json(
                { error: "url is required" },
                { status: 400 }
            );
        }

        const domain = extractDomain(url);

        // Fetch the URL with timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        let html = "";
        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    "User-Agent": "Mozilla/5.0 (compatible; CampusClubBot/1.0)",
                    "Accept": "text/html",
                },
            });
            clearTimeout(timeout);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            // Only read first 50KB to avoid memory issues
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let size = 0;
            const maxSize = 50 * 1024;

            if (reader) {
                while (size < maxSize) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    html += decoder.decode(value, { stream: true });
                    size += value.length;
                }
                reader.cancel();
            }
        } catch (fetchError) {
            clearTimeout(timeout);
            console.error("Fetch error:", fetchError);
            // Return minimal data
            return NextResponse.json({
                url,
                og_title: null,
                og_description: null,
                og_image_url: null,
                domain,
            });
        }

        const ogData = extractOgTags(html);

        const result = {
            url,
            ...ogData,
            domain,
        };

        // Save to database if messageId provided
        if (messageId) {
            const supabase = await createClient();
            await supabase.from("message_links").upsert({
                message_id: messageId,
                ...result,
            }, {
                onConflict: "message_id,url",
            });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Link preview error:", error);
        return NextResponse.json(
            { error: "Failed to fetch link preview" },
            { status: 500 }
        );
    }
}
