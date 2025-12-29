"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, X } from "lucide-react";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/lib/image-utils";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const STEPS = [
    { title: "Profile Info", description: "Let's get to know you" },
    { title: "Interests", description: "What are you into?" },
    { title: "Goal", description: "What's your current focus?" },
];

const INTEREST_OPTIONS = ["Startup", "AI", "Research", "Design", "Engineering", "Finance", "Marketing", "Data Science"];

export default function OnboardingPage() {
    const [step, setStep] = useState(0);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [university, setUniversity] = useState("Institute of Science Tokyo (東京科学大学)");
    const [faculty, setFaculty] = useState("");
    const [grade, setGrade] = useState("");
    const [interests, setInterests] = useState<string[]>([]);
    const [goal, setGoal] = useState("");
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    // Avatar state
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    // Cropping state
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [isCropping, setIsCropping] = useState(false);
    const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);

    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
            } else {
                router.push("/login");
            }
        };
        getUser();
    }, [supabase, router]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener("load", () => {
                setTempImageSrc(reader.result?.toString() || "");
                setIsCropping(true);
            });
            reader.readAsDataURL(file);
        }
    };

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleCropConfirm = async () => {
        if (!tempImageSrc || !croppedAreaPixels) return;

        try {
            const croppedBlob = await getCroppedImg(
                tempImageSrc,
                croppedAreaPixels
            );

            if (croppedBlob) {
                const file = new File([croppedBlob], "avatar.png", { type: "image/png" });
                setAvatarFile(file);
                setAvatarPreview(URL.createObjectURL(croppedBlob));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsCropping(false);
            setTempImageSrc(null);
            setZoom(1);
        }
    };

    const toggleInterest = (interest: string) => {
        if (interests.includes(interest)) {
            setInterests(interests.filter((i) => i !== interest));
        } else {
            setInterests([...interests, interest]);
        }
    };

    const handleNext = () => {
        if (step === 0 && (!firstName.trim() || !lastName.trim())) {
            alert("Please provide your First Name and Last Name.");
            return;
        }
        if (step < STEPS.length - 1) {
            setStep(step + 1);
        }
    };

    const handleComplete = async () => {
        if (!userId) return;
        setLoading(true);

        const displayName = `${firstName} ${lastName}`.trim();
        let avatarUrl = null;

        if (avatarFile) {
            const fileExt = "png"; // Always png due to conversion
            const filePath = `${userId}/${crypto.randomUUID()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(filePath, avatarFile);

            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage
                    .from("avatars")
                    .getPublicUrl(filePath);
                avatarUrl = publicUrl;
            } else {
                console.error("Avatar upload failed:", uploadError);
            }
        }

        const { error } = await supabase
            .from("profiles")
            .update({
                display_name: displayName,
                avatar_url: avatarUrl,
                university,
                faculty,
                grade,
                interests,
                goal,
                is_onboarded: true
            })
            .eq("id", userId);

        if (!error) {
            router.push("/dashboard");
            router.refresh();
        } else {
            console.error("Failed to save profile:", error);
        }

        setLoading(false);
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <div className="w-full max-w-lg space-y-6">
                <div className="flex justify-between px-2">
                    {STEPS.map((s, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-medium transition-colors ${i <= step
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-muted-foreground text-muted-foreground"
                                    }`}
                            >
                                {i + 1}
                            </div>
                            <span className="text-xs text-muted-foreground">{s.title}</span>
                        </div>
                    ))}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{STEPS[step].title}</CardTitle>
                        <CardDescription>{STEPS[step].description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {step === 0 && (
                            <>
                                {/* Avatar Upload */}
                                <div className="flex flex-col items-center gap-4 mb-6">
                                    <Avatar className="h-24 w-24 border-2 border-border">
                                        <AvatarImage src={avatarPreview || undefined} />
                                        <AvatarFallback className="text-2xl">
                                            {firstName && lastName ? `${firstName[0]}${lastName[0]}` : "?"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex items-center gap-2">
                                        <label htmlFor="avatar-upload" className="cursor-pointer">
                                            <div className="flex items-center gap-2 text-sm font-medium hover:underline">
                                                <Upload className="h-4 w-4" />
                                                Upload Icon
                                            </div>
                                            <input
                                                id="avatar-upload"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleAvatarChange}
                                            />
                                        </label>
                                        {avatarPreview && (
                                            <Button variant="ghost" size="sm" onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">First Name <span className="text-red-500">*</span></label>
                                        <Input
                                            placeholder="Taro"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Last Name <span className="text-red-500">*</span></label>
                                        <Input
                                            placeholder="Yamada"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">University</label>
                                    <Input
                                        disabled
                                        value="Institute of Science Tokyo (東京科学大学)"
                                        className="bg-muted text-muted-foreground"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Faculty</label>
                                        <Input
                                            placeholder="e.g., Engineering"
                                            value={faculty}
                                            onChange={(e) => setFaculty(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Grade</label>
                                        <Input
                                            placeholder="e.g., B3, M1"
                                            value={grade}
                                            onChange={(e) => setGrade(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {step === 1 && (
                            <div className="space-y-4">
                                <label className="text-sm font-medium">Select Interests</label>
                                <div className="flex flex-wrap gap-2">
                                    {INTEREST_OPTIONS.map((tag) => (
                                        <Badge
                                            key={tag}
                                            variant={interests.includes(tag) ? "default" : "outline"}
                                            className="cursor-pointer transition-colors"
                                            onClick={() => toggleInterest(tag)}
                                        >
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-4">
                                <label className="text-sm font-medium">Current Goal</label>
                                <Input
                                    placeholder="Launch a startup, Publish a paper, etc."
                                    value={goal}
                                    onChange={(e) => setGoal(e.target.value)}
                                />
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button
                            variant="ghost"
                            onClick={() => setStep(Math.max(0, step - 1))}
                            disabled={step === 0}
                        >
                            Back
                        </Button>
                        {step === STEPS.length - 1 ? (
                            <Button onClick={handleComplete} disabled={loading}>
                                {loading ? "Saving..." : "Complete"}
                            </Button>
                        ) : (
                            <Button onClick={handleNext}>Next</Button>
                        )}
                    </CardFooter>
                </Card>
            </div>

            {/* Crop Dialog */}
            <Dialog open={isCropping} onOpenChange={setIsCropping}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Photo</DialogTitle>
                    </DialogHeader>
                    <div className="relative w-full h-80 bg-black">
                        {tempImageSrc && (
                            <Cropper
                                image={tempImageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        )}
                    </div>
                    <div className="py-4">
                        <label className="text-sm font-medium">Zoom</label>
                        <Slider
                            value={[zoom]}
                            min={1}
                            max={3}
                            step={0.1}
                            onValueChange={(value) => setZoom(value[0])}
                            className="w-full mt-2"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCropping(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCropConfirm}>
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
