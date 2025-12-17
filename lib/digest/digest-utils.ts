import "server-only";
import Parser from "rss-parser";
import { createHash } from "crypto";
import OpenAI from "openai";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Types
export interface RSSFeedConfig {
    url: string;
    source: string;
    company: string;
    category: string;
    keywordBoost: string[];  // Keywords that boost importance
}

export interface DigestItemInput {
    id: string;
    url: string;
    title: string;
    source: string;
    company: string;
    category: string;
    published_at: string;
    importance: number;
    raw_excerpt: string;
}

// RSS Feed configurations
export const RSS_FEEDS: RSSFeedConfig[] = [
    // Tier 1 - Major AI Companies
    {
        url: "https://openai.com/news/rss.xml",
        source: "OpenAI Blog",
        company: "OpenAI",
        category: "model",
        keywordBoost: ["GPT", "ChatGPT", "API", "o1", "o3", "Sora"],
    },
    {
        url: "https://www.anthropic.com/research/feed.xml",
        source: "Anthropic Research",
        company: "Anthropic",
        category: "research",
        keywordBoost: ["Claude", "Constitutional AI", "RLHF"],
    },
    {
        url: "https://blog.google/technology/ai/rss/",
        source: "Google AI Blog",
        company: "Google",
        category: "model",
        keywordBoost: ["Gemini", "Bard", "PaLM", "DeepMind", "Veo"],
    },
    {
        url: "https://blogs.microsoft.com/ai/feed/",
        source: "Microsoft AI Blog",
        company: "Microsoft",
        category: "tool",
        keywordBoost: ["Copilot", "Azure", "OpenAI"],
    },
    {
        url: "https://ai.meta.com/blog/rss.xml",
        source: "Meta AI Blog",
        company: "Meta",
        category: "research",
        keywordBoost: ["LLaMA", "Llama", "AI", "ML"],
    },
    // Tier 2 - Cloud/Hardware
    {
        url: "https://blogs.nvidia.com/feed/",
        source: "NVIDIA Blog",
        company: "NVIDIA",
        category: "hardware",
        keywordBoost: ["GPU", "CUDA", "AI", "inference"],
    },
    {
        url: "https://aws.amazon.com/blogs/machine-learning/feed/",
        source: "AWS ML Blog",
        company: "AWS",
        category: "cloud",
        keywordBoost: ["Bedrock", "SageMaker", "Lambda"],
    },
    // Tier 3 - Developer Tools
    {
        url: "https://huggingface.co/blog/feed.xml",
        source: "Hugging Face Blog",
        company: "Hugging Face",
        category: "tool",
        keywordBoost: ["transformers", "diffusers", "models"],
    },
    {
        url: "https://www.langchain.com/blog/rss.xml",
        source: "LangChain Blog",
        company: "LangChain",
        category: "tool",
        keywordBoost: ["LangChain", "agent", "RAG"],
    },
    // News/Research
    {
        url: "https://www.technologyreview.com/feed/",
        source: "MIT Tech Review",
        company: "MIT",
        category: "news",
        keywordBoost: ["AI", "machine learning", "breakthrough"],
    },
    {
        url: "https://techcrunch.com/category/artificial-intelligence/feed/",
        source: "TechCrunch AI",
        company: "TechCrunch",
        category: "news",
        keywordBoost: ["startup", "funding", "AI"],
    },
];

// High-value keywords for scoring
const HIGH_VALUE_KEYWORDS = [
    "GPT-5", "GPT-4", "Claude", "Gemini", "o1", "o3",
    "breakthrough", "release", "launch", "announce",
    "API", "pricing", "model", "LLM", "agent",
    "fine-tuning", "RAG", "embedding",
];

// Generate sha256 ID from URL
export function generateDigestId(url: string): string {
    return createHash("sha256").update(url).digest("hex");
}

// Calculate importance score (0-100)
export function calculateImportance(
    title: string,
    content: string,
    publishedAt: Date,
    feedConfig: RSSFeedConfig
): number {
    let score = 50;  // Base score

    const text = `${title} ${content}`.toLowerCase();

    // Keyword boost from feed config (+5 each, max +15)
    let feedKeywordBoost = 0;
    for (const keyword of feedConfig.keywordBoost) {
        if (text.includes(keyword.toLowerCase())) {
            feedKeywordBoost += 5;
        }
    }
    score += Math.min(feedKeywordBoost, 15);

    // High-value keyword boost (+3 each, max +15)
    let highValueBoost = 0;
    for (const keyword of HIGH_VALUE_KEYWORDS) {
        if (text.includes(keyword.toLowerCase())) {
            highValueBoost += 3;
        }
    }
    score += Math.min(highValueBoost, 15);

    // Recency boost (last 24h: +10, last 3d: +5)
    const now = new Date();
    const hoursAgo = (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60);
    if (hoursAgo < 24) {
        score += 10;
    } else if (hoursAgo < 72) {
        score += 5;
    }

    // Source tier boost
    const tier1Sources = ["OpenAI", "Google", "Anthropic"];
    const tier2Sources = ["Microsoft", "Meta", "AWS"];
    if (tier1Sources.includes(feedConfig.company)) {
        score += 10;
    } else if (tier2Sources.includes(feedConfig.company)) {
        score += 5;
    }

    return Math.min(Math.max(score, 0), 100);
}

// Fetch RSS feed items
export async function fetchRSSFeed(feedConfig: RSSFeedConfig): Promise<DigestItemInput[]> {
    const parser = new Parser({
        timeout: 10000,
        headers: {
            "User-Agent": "CampusApp/1.0 RSS Reader",
        },
    });

    try {
        const feed = await parser.parseURL(feedConfig.url);
        const items: DigestItemInput[] = [];

        for (const item of feed.items.slice(0, 20)) {  // Limit to 20 per feed
            if (!item.link || !item.title) continue;

            const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();
            const rawExcerpt = item.contentSnippet || item.content || "";

            const importance = calculateImportance(
                item.title,
                rawExcerpt,
                publishedAt,
                feedConfig
            );

            items.push({
                id: generateDigestId(item.link),
                url: item.link,
                title: item.title,
                source: feedConfig.source,
                company: feedConfig.company,
                category: feedConfig.category,
                published_at: publishedAt.toISOString(),
                importance,
                raw_excerpt: rawExcerpt.slice(0, 500),
            });
        }

        return items;
    } catch (error) {
        console.error(`Failed to fetch RSS feed ${feedConfig.url}:`, error);
        return [];
    }
}

// Generate summary using OpenAI
export async function generateSummary(
    title: string,
    content: string,
    lang: "jp" | "en" = "jp"
): Promise<{ short: string; long: string; tags: string[] }> {
    const openai = new OpenAI();

    const langPrompt = lang === "jp" ? "日本語で" : "In English";

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `あなたはAIニュースの要約者です。${langPrompt}回答してください。`,
                },
                {
                    role: "user",
                    content: `以下のニュース記事を要約してください。

タイトル: ${title}
内容: ${content}

JSON形式で以下を返してください:
{
  "summary_short": "1-2文の短い要約",
  "summary_long": "3-5文の詳細な要約", 
  "tags": ["タグ1", "タグ2", "タグ3", "タグ4", "タグ5"]
}`,
                },
            ],
            response_format: { type: "json_object" },
            max_tokens: 500,
        });

        const result = JSON.parse(response.choices[0].message.content || "{}");
        return {
            short: result.summary_short || content.slice(0, 100),
            long: result.summary_long || content.slice(0, 300),
            tags: result.tags || [],
        };
    } catch (error) {
        console.error("Summary generation failed:", error);
        // Fallback
        return {
            short: content.slice(0, 100) + "...",
            long: content.slice(0, 300) + "...",
            tags: [],
        };
    }
}

// Generate daily memo
export async function generateDailyMemo(
    topItems: Array<{ title: string; source: string }>,
    lang: "jp" | "en" = "jp"
): Promise<string> {
    if (topItems.length === 0) {
        return lang === "jp" ? "本日の重要ニュースはありません。" : "No significant news today.";
    }

    const openai = new OpenAI();
    const langPrompt = lang === "jp" ? "日本語で" : "In English";

    try {
        const itemsList = topItems
            .slice(0, 10)
            .map((item, i) => `${i + 1}. ${item.title} (${item.source})`)
            .join("\n");

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `あなたはAI/テック業界のニュースキュレーターです。${langPrompt}回答してください。`,
                },
                {
                    role: "user",
                    content: `以下のトップニュースから、今日のAI業界の動向を2-3行で簡潔にまとめてください:

${itemsList}`,
                },
            ],
            max_tokens: 200,
        });

        return response.choices[0].message.content || "今日のAIニュースダイジェストです。";
    } catch (error) {
        console.error("Daily memo generation failed:", error);
        return lang === "jp"
            ? `本日の注目: ${topItems[0]?.title || "新着ニュースをチェック"}`
            : `Today's highlight: ${topItems[0]?.title || "Check the latest news"}`;
    }
}

// Main refresh function
export async function refreshDigest(): Promise<{
    itemsAdded: number;
    summariesGenerated: number;
    memoGenerated: boolean;
}> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseServiceKey) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for digest refresh");
    }

    const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    let itemsAdded = 0;
    let summariesGenerated = 0;
    let memoGenerated = false;

    // 1. Fetch all RSS feeds
    const allItems: DigestItemInput[] = [];
    for (const feed of RSS_FEEDS) {
        const items = await fetchRSSFeed(feed);
        allItems.push(...items);
    }

    // 2. Upsert items to digest_items
    for (const item of allItems) {
        const { error } = await supabase
            .from("digest_items")
            .upsert({
                id: item.id,
                url: item.url,
                title: item.title,
                source: item.source,
                company: item.company,
                category: item.category,
                published_at: item.published_at,
                importance: item.importance,
                raw_excerpt: item.raw_excerpt,
            }, { onConflict: "id" });

        if (!error) itemsAdded++;
    }

    // 3. Generate summaries for items without summaries
    const { data: itemsNeedingSummary } = await supabase
        .from("digest_items")
        .select("id, title, raw_excerpt")
        .gte("importance", 20)
        .order("importance", { ascending: false })
        .limit(50);

    for (const item of itemsNeedingSummary || []) {
        // Check if summary exists
        const { data: existingSummary } = await supabase
            .from("digest_summaries")
            .select("id")
            .eq("digest_id", item.id)
            .eq("lang", "jp")
            .single();

        if (!existingSummary) {
            const summary = await generateSummary(item.title, item.raw_excerpt, "jp");

            await supabase.from("digest_summaries").insert({
                digest_id: item.id,
                lang: "jp",
                summary_short: summary.short,
                summary_long: summary.long,
                tags: summary.tags,
                model_name: "gpt-4o-mini",
            });

            summariesGenerated++;
        }
    }

    // 4. Generate daily memo
    const today = new Date().toISOString().split("T")[0];
    const { data: existingMemo } = await supabase
        .from("digest_daily_memos")
        .select("id")
        .eq("date", today)
        .eq("lang", "jp")
        .single();

    if (!existingMemo) {
        const { data: topItems } = await supabase
            .from("digest_items")
            .select("title, source")
            .gte("importance", 50)
            .order("importance", { ascending: false })
            .limit(10);

        if (topItems && topItems.length > 0) {
            const memo = await generateDailyMemo(topItems, "jp");

            await supabase.from("digest_daily_memos").insert({
                date: today,
                lang: "jp",
                memo_text: memo,
                model_name: "gpt-4o-mini",
            });

            memoGenerated = true;
        }
    }

    return { itemsAdded, summariesGenerated, memoGenerated };
}
