"use client";

import { useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

interface UploadResult {
    path: string;
    width?: number;
    height?: number;
    mimeType: string;
}

export function useImageUpload(roomId: string) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const supabase = useMemo(() => createClient(), []);

    const uploadImages = useCallback(async (files: File[]): Promise<UploadResult[]> => {
        setUploading(true);
        setProgress(0);
        setError(null);

        const results: UploadResult[] = [];
        const total = files.length;

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                // Validate file type
                if (!file.type.startsWith("image/")) {
                    throw new Error(`File ${file.name} is not an image`);
                }

                // Generate unique path
                const fileExt = file.name.split(".").pop();
                const fileName = `${crypto.randomUUID()}.${fileExt}`;
                const filePath = `${roomId}/${fileName}`;

                // Upload to Supabase Storage
                const { data, error: uploadError } = await supabase.storage
                    .from("chat-images")
                    .upload(filePath, file, {
                        cacheControl: "3600",
                        upsert: false,
                    });

                if (uploadError) throw uploadError;

                // Get image dimensions (optional)
                let width: number | undefined;
                let height: number | undefined;

                try {
                    const dimensions = await getImageDimensions(file);
                    width = dimensions.width;
                    height = dimensions.height;
                } catch {
                    // Ignore dimension errors
                }

                results.push({
                    path: data.path,
                    width,
                    height,
                    mimeType: file.type,
                });

                setProgress(((i + 1) / total) * 100);
            }

            return results;
        } catch (err) {
            console.error("Upload error:", err);
            setError(err instanceof Error ? err.message : "Upload failed");
            throw err;
        } finally {
            setUploading(false);
        }
    }, [supabase, roomId]);

    const deleteImage = useCallback(async (path: string) => {
        const { error } = await supabase.storage
            .from("chat-images")
            .remove([path]);

        if (error) throw error;
    }, [supabase]);

    return {
        uploadImages,
        deleteImage,
        uploading,
        progress,
        error,
    };
}

// Helper to get image dimensions
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve({ width: img.width, height: img.height });
            URL.revokeObjectURL(img.src);
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}
