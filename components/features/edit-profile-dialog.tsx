"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { Edit, Image as ImageIcon, ZoomIn, ZoomOut } from "lucide-react";

interface EditProfileDialogProps {
    profile: {
        id: string;
        display_name: string | null;
        university: string | null;
        faculty: string | null;
        grade: string | null;
        goal: string | null;
        avatar_url: string | null;
    };
}

export function EditProfileDialog({ profile }: EditProfileDialogProps) {
    const [open, setOpen] = useState(false);

    // Form State
    const [displayName, setDisplayName] = useState(profile.display_name || "");
    const [university, setUniversity] = useState(profile.university || "");
    const [faculty, setFaculty] = useState(profile.faculty || "");
    const [grade, setGrade] = useState(profile.grade || "");
    const [goal, setGoal] = useState(profile.goal || "");
    const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");

    // Status State
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);

    // Crop State
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [showCrop, setShowCrop] = useState(false);

    const router = useRouter();
    const supabase = createClient();

    // Sync state with profile prop
    useEffect(() => {
        setDisplayName(profile.display_name || "");
        setUniversity(profile.university || "");
        setFaculty(profile.faculty || "");
        setGrade(profile.grade || "");
        setGoal(profile.goal || "");
        setAvatarUrl(profile.avatar_url || "");
    }, [profile]);

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const readFile = (file: File) => {
        return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.addEventListener("load", () => resolve(reader.result as string));
            reader.readAsDataURL(file);
        });
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            const imageDataUrl = await readFile(file);
            setImageSrc(imageDataUrl);
            setShowCrop(true);
        }
    };

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener("load", () => resolve(image));
            image.addEventListener("error", (error) => reject(error));
            image.setAttribute("crossOrigin", "anonymous");
            image.src = url;
        });

    const getCroppedImg = async (
        imageSrc: string,
        pixelCrop: any
    ): Promise<Blob | null> => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            return null;
        }

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            }, "image/jpeg");
        });
    };

    const handleCropSave = async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        try {
            setUploading(true);
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

            if (!croppedBlob) {
                throw new Error("Could not create cropped image");
            }

            const fileName = `${profile.id}/${Date.now()}.jpg`;
            const file = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });

            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from("avatars")
                .getPublicUrl(fileName);

            setAvatarUrl(publicUrl);
            setShowCrop(false);
            setImageSrc(null);
            setZoom(1);

        } catch (e) {
            console.error(e);
            alert("Failed to upload image");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase
            .from("profiles")
            .update({
                display_name: displayName,
                university,
                faculty,
                grade,
                goal,
                avatar_url: avatarUrl,
            })
            .eq("id", profile.id);

        if (!error) {
            setOpen(false);
            router.refresh();
            // Dispatch event to update Sidebar
            window.dispatchEvent(new Event("profile-updated"));
        }

        setLoading(false);
    };

    // Crop Dialog UI
    if (showCrop && imageSrc) {
        return (
            <Dialog open={showCrop} onOpenChange={setShowCrop}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Adjust Image</DialogTitle>
                        <DialogDescription>
                            Drag to position and pinch/scroll to zoom.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="relative h-64 w-full bg-black">
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                            cropShape="round"
                            showGrid={false}
                        />
                    </div>
                    <div className="py-4 flex items-center gap-4">
                        <ZoomOut className="h-4 w-4" />
                        <Slider
                            value={[zoom]}
                            min={1}
                            max={3}
                            step={0.1}
                            onValueChange={(value: number[]) => setZoom(value[0])}
                            className="flex-1"
                        />
                        <ZoomIn className="h-4 w-4" />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => {
                            setShowCrop(false);
                            setImageSrc(null);
                        }}>Cancel</Button>
                        <Button onClick={handleCropSave} disabled={uploading}>
                            {uploading ? "Saving..." : "Apply"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Edit className="h-4 w-4" /> Edit Profile
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                        Update your profile information.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center space-y-4">
                        <div className="relative group cursor-pointer overflow-hidden rounded-full h-24 w-24 border">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full bg-muted flex items-center justify-center">
                                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                </div>
                            )}
                            <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <span className="text-xs font-medium">Change</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                            id="displayName"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Your name"
                        />
                    </div>
                    {/* ... rest of the form ... */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="university">University</Label>
                            <Input
                                id="university"
                                value={university}
                                onChange={(e) => setUniversity(e.target.value)}
                                placeholder="e.g., University of Tokyo"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="faculty">Faculty</Label>
                            <Input
                                id="faculty"
                                value={faculty}
                                onChange={(e) => setFaculty(e.target.value)}
                                placeholder="e.g., Engineering"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="grade">Grade</Label>
                        <Input
                            id="grade"
                            value={grade}
                            onChange={(e) => setGrade(e.target.value)}
                            placeholder="e.g., M1, B3"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="goal">Current Goal</Label>
                        <Textarea
                            id="goal"
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            placeholder="What are you working on?"
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading || uploading}>
                        {loading ? "Saving..." : "Save Changes"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
