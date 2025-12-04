import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
    try {
        const { text, locale = "ja" } = await req.json();

        if (!text || typeof text !== "string") {
            return NextResponse.json(
                { error: "Text is required" },
                { status: 400 }
            );
        }

        const now = new Date();
        const timezone = locale === "ja" ? "Asia/Tokyo" : "UTC";

        const systemPrompt = `You are a schedule parsing assistant. Extract a single event from the user's text and output strict JSON.

Current date/time reference: ${now.toISOString()} (Timezone: ${timezone})

Fields to extract:
- title: short title of the event (string, required)
- datetime: ISO 8601 datetime string in ${timezone} timezone (string, required)
- location: short location text if given, else null
- notes: original text or additional notes if helpful

When parsing relative dates:
- "明日" / "tomorrow" = next day
- "来週" / "next week" = 7 days from now
- "来週水曜" = next Wednesday
- If time is not specified, assume 12:00 (noon)

Return ONLY valid JSON, no extra text or markdown.
Example output: {"title":"ミーティング","datetime":"2024-12-11T15:00:00+09:00","location":"会議室A","notes":"チームミーティング"}`;

        const response = await client.responses.create({
            model: "gpt-4.1-mini",
            input: [
                {
                    role: "system",
                    content: systemPrompt,
                },
                {
                    role: "user",
                    content: text,
                },
            ],
        });

        // Extract text from response
        const outputText = response.output_text;

        if (!outputText) {
            return NextResponse.json(
                { error: "No response from AI" },
                { status: 500 }
            );
        }

        // Parse JSON from response
        let parsedEvent;
        try {
            // Clean up potential markdown code blocks
            const cleanedText = outputText
                .replace(/```json\n?/g, "")
                .replace(/```\n?/g, "")
                .trim();
            parsedEvent = JSON.parse(cleanedText);
        } catch {
            return NextResponse.json(
                { error: "Failed to parse AI response", raw: outputText },
                { status: 500 }
            );
        }

        return NextResponse.json({ event: parsedEvent });
    } catch (error) {
        console.error("Schedule parse error:", error);
        return NextResponse.json(
            { error: "Failed to parse schedule" },
            { status: 500 }
        );
    }
}
