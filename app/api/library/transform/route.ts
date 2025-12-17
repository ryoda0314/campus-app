import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { TransformRequest, TransformResult, TransformResponse } from "@/lib/types/library";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

const SYSTEM_PROMPT = `あなたは知識抽出アシスタントです。テキストを読み、初めてその情報に触れる読者が理解しやすい「読み物」として整形してください。

## あなたの役割

- 情報の論理構成（どんなセクションに分けるか）をあなたが考えてください
- 固定のフォーマットはありません。内容に応じて最適な構成を選んでください
- 読者が「なるほど」と思える、流れのある説明を心がけてください

## 出力形式（JSON形式）

{
  "title": "内容を端的に表す日本語タイトル",
  "tldr": "この情報が何に役立つのか、1〜2文で説明",
  "sections": [
    { "heading": "あなたが考えたセクション見出し", "content": "そのセクションの本文（自然な文章）" },
    { "heading": "次のセクション見出し", "content": "その本文" }
  ],
  "tags": {
    "assign_existing": ["該当する既存タグ"],
    "propose_new": ["必要な場合のみ、0〜3個の新規タグ（entity:* または topic:* のみ）"]
  }
}

## sectionsの構成例（参考）

内容に応じて、以下のような見出しを自由に組み合わせてください：
- 「背景」「これまでの経緯」
- 「仕組み」「どう動くか」
- 「使い方」「実践方法」
- 「注意点」「制限事項」
- 「なぜ重要か」「インパクト」
- 「今後の展望」
- その他、内容に合った見出し

## コード・設定ファイルの扱い（最重要）

### コードブロックに入れるもの（必須）
以下に該当するものは、必ず \`\`\` で囲んだコードブロックにしてください：
1. プログラムコード（Python, JavaScript, TypeScript等）
2. 設定ファイルの内容（YAML, JSON, XML, TOML等）
3. コマンドライン / シェルコマンド
4. システムプロンプト / AIへの指示文
5. APIリクエスト・レスポンスの例

### コードブロックの書き方
JSON形式でcontentを書く際、コードブロックは以下のようにエスケープして記述します：

"content": "説明文です。\\n\\n\`\`\`yaml\\nkey: value\\nname: テスト\\n\`\`\`\\n\\nこのように使います。"

### 重要なルール
- 設定ファイルは**全体**を1つのコードブロックに入れる（途中で分割しない）
- 「〜です」「〜ます」で終わる説明文はコードブロックに入れない
- コードブロックの前後には説明文を付ける

## 表（テーブル）の扱い（重要）

原文に表形式のデータやリスト形式で比較・整理されたデータがある場合、Markdown形式の表として整形してください：

| 項目 | 説明 | 備考 |
|------|------|------|
| 例1 | 説明文 | 補足 |
| 例2 | 説明文 | 補足 |

表は積極的に使ってください。特に以下のケースでは表が効果的です：
- 複数の項目の比較
- パラメータや設定値の一覧
- 手順やステップの整理

## リスト（箇条書き）の扱い

列挙や順序付きの内容は、Markdownリスト形式で記述してください：

箇条書き：
- 項目1
- 項目2
- 項目3

番号付き：
1. 手順1
2. 手順2
3. 手順3

## 数式の扱い

数式が含まれる場合、LaTeX形式で記述してください：
- インライン数式：$E = mc^2$
- ディスプレイ数式：$$\\sum_{i=1}^{n} x_i = x_1 + x_2 + ... + x_n$$

## 重要なルール

1. 日本語で出力してください
2. 通常の説明は自然な文章で書いてください
3. コード・プロンプト・設定例は必ず3つのバッククォートで囲む（上記形式）
4. 表・リスト・数式は上記のMarkdown形式を使用してください
5. 原文の表現をそのまま使い回さず、自分の言葉で説明してください
6. 推測は「〜と考えられる」「おそらく〜」と明示してください
7. タグについて：
   - まず既存タグ（existing_tags）から該当するものを選んでください
   - 新規タグは entity:*（固有名詞）または topic:*（概念）のみ
   - facet, api, prompt, stack, status, impact の新規作成は禁止

JSONのみを出力してください。`;

export async function POST(req: NextRequest) {
    try {
        const body: TransformRequest = await req.json();
        const { raw_text, existing_tags = [], source_url } = body;

        if (!raw_text || typeof raw_text !== "string" || raw_text.trim().length === 0) {
            return NextResponse.json<TransformResponse>(
                { success: false, error: "raw_text is required" },
                { status: 400 }
            );
        }

        // Truncate text if too long (max 10k characters for testing)
        const maxLength = 10000;
        const truncatedText = raw_text.length > maxLength
            ? raw_text.slice(0, maxLength) + "\n\n...(以下省略)"
            : raw_text;

        console.log("Original text length:", raw_text.length, "Truncated:", truncatedText.length);

        // Build user prompt with context
        let userPrompt = `以下のテキストを整形してください：\n\n${truncatedText}`;
        if (source_url) {
            userPrompt = `参照元URL: ${source_url}\n\n${userPrompt}`;
        }

        // Add existing tags for reference
        const tagsContext = existing_tags.length > 0
            ? `\n\n利用可能な既存タグ（まずこれらから選んでください）:\n${existing_tags.join(", ")}`
            : "";

        console.log("Calling OpenAI with text length:", truncatedText.length);

        let response;
        try {
            response = await client.responses.create({
                model: "gpt-5.2",
                input: [
                    {
                        role: "system",
                        content: SYSTEM_PROMPT + tagsContext,
                    },
                    {
                        role: "user",
                        content: userPrompt,
                    },
                ],
            });
            console.log("OpenAI response received");
        } catch (apiError) {
            console.error("OpenAI API error:", apiError);
            if (apiError instanceof Error) {
                return NextResponse.json<TransformResponse>(
                    { success: false, error: `OpenAI API error: ${apiError.message}` },
                    { status: 500 }
                );
            }
            throw apiError;
        }

        const outputText = response.output_text;
        console.log("Output text length:", outputText?.length || 0);

        if (!outputText) {
            console.error("No output text from OpenAI. Response:", JSON.stringify(response));
            return NextResponse.json<TransformResponse>(
                { success: false, error: "No response from AI" },
                { status: 500 }
            );
        }

        // Parse JSON from response
        let result: TransformResult;
        try {
            // Clean up potential markdown code blocks
            const cleanedText = outputText
                .replace(/```json\n?/g, "")
                .replace(/```\n?/g, "")
                .trim();
            result = JSON.parse(cleanedText);
        } catch {
            return NextResponse.json<TransformResponse>(
                { success: false, error: "Failed to parse AI response" },
                { status: 500 }
            );
        }

        // Validate required fields
        if (!result.title || !result.sections) {
            return NextResponse.json<TransformResponse>(
                { success: false, error: "Invalid transform result structure" },
                { status: 500 }
            );
        }

        // Ensure arrays
        result.sections = result.sections || [];
        result.tags = result.tags || { assign_existing: [], propose_new: [] };

        // Filter out any invalid propose_new tags (only allow entity:* and topic:*)
        if (result.tags.propose_new) {
            result.tags.propose_new = result.tags.propose_new.filter(tag =>
                tag.startsWith("entity:") || tag.startsWith("topic:")
            );
        }

        return NextResponse.json<TransformResponse>({ success: true, result });

    } catch (error) {
        console.error("Transform error:", error);

        // Log more details
        if (error instanceof Error) {
            console.error("Error name:", error.name);
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);

            return NextResponse.json<TransformResponse>(
                { success: false, error: `Transform failed: ${error.message}` },
                { status: 500 }
            );
        }

        return NextResponse.json<TransformResponse>(
            { success: false, error: "Failed to transform content" },
            { status: 500 }
        );
    }
}
