import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

const LANGUAGE_NAMES: Record<string, string> = {
    en: "English",
    ja: "Japanese",
    ko: "Korean",
    zh: "Chinese",
};

export async function POST(req: NextRequest) {
    try {
        const { text, targetLanguage } = await req.json();

        if (!text || !targetLanguage) {
            return NextResponse.json(
                { error: "text and targetLanguage are required" },
                { status: 400 }
            );
        }

        const languageName = LANGUAGE_NAMES[targetLanguage] || targetLanguage;

        const systemPrompt = `You are a translation assistant. Translate the user's message into ${languageName}.
Return only the translated text, no explanations or additional formatting.
Preserve any @mentions, URLs, and emoji in the original format.`;

        const response = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: text }
            ],
            max_tokens: 1000,
            temperature: 0.3,
        });

        const translated = response.choices[0]?.message?.content?.trim() || "";

        return NextResponse.json({ translated });
    } catch (error) {
        console.error("Translation error:", error);
        return NextResponse.json(
            { error: "Translation failed" },
            { status: 500 }
        );
    }
}
