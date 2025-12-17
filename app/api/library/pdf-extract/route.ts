import { NextRequest, NextResponse } from "next/server";
import { extractText } from "unpdf";

// Force Node.js runtime
export const runtime = "nodejs";

interface PdfExtractResponse {
    success: boolean;
    text?: string;
    pageCount?: number;
    error?: string;
}

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json<PdfExtractResponse>(
                { success: false, error: "No file uploaded" },
                { status: 400 }
            );
        }

        console.log("PDF file received:", file.name, file.size, file.type);

        // Validate file type
        if (file.type !== "application/pdf") {
            return NextResponse.json<PdfExtractResponse>(
                { success: false, error: "File must be a PDF" },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json<PdfExtractResponse>(
                { success: false, error: "File size exceeds 10MB limit" },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);
        console.log("Buffer created, size:", buffer.length);

        // Extract text using unpdf
        console.log("Extracting text with unpdf...");
        const { text, totalPages } = await extractText(buffer, { mergePages: true });
        console.log("Extraction complete, pages:", totalPages);

        if (!text || text.trim().length === 0) {
            return NextResponse.json<PdfExtractResponse>(
                { success: false, error: "No text content found in PDF. The PDF might be image-based or empty." },
                { status: 400 }
            );
        }

        // Clean up extracted text
        const cleanedText = text
            .replace(/[ \t]+/g, " ")
            .replace(/\n{3,}/g, "\n\n")
            .trim();

        console.log("Text extracted, length:", cleanedText.length);

        return NextResponse.json<PdfExtractResponse>({
            success: true,
            text: cleanedText,
            pageCount: totalPages,
        });

    } catch (error) {
        console.error("PDF extract error:", error);

        if (error instanceof Error) {
            console.error("Error message:", error.message);

            if (error.message.includes("password")) {
                return NextResponse.json<PdfExtractResponse>(
                    { success: false, error: "PDF is password protected" },
                    { status: 400 }
                );
            }

            return NextResponse.json<PdfExtractResponse>(
                { success: false, error: `PDF extraction failed: ${error.message}` },
                { status: 500 }
            );
        }

        return NextResponse.json<PdfExtractResponse>(
            { success: false, error: "Failed to extract text from PDF" },
            { status: 500 }
        );
    }
}
