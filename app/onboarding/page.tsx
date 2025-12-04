"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STEPS = [
    { title: "Basic Info", description: "Tell us about yourself" },
    { title: "Interests", description: "What are you into?" },
    { title: "Goal", description: "What's your current focus?" },
];

const INTEREST_OPTIONS = ["Startup", "AI", "Research", "Design", "Engineering", "Finance", "Marketing", "Data Science"];

export default function OnboardingPage() {
    const [step, setStep] = useState(0);
    const [displayName, setDisplayName] = useState("");
    const [university, setUniversity] = useState("");
    const [faculty, setFaculty] = useState("");
    const [grade, setGrade] = useState("");
    const [interests, setInterests] = useState<string[]>([]);
    const [goal, setGoal] = useState("");
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
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

    const toggleInterest = (interest: string) => {
        if (interests.includes(interest)) {
            setInterests(interests.filter((i) => i !== interest));
        } else {
            setInterests([...interests, interest]);
        }
    };

    const handleNext = () => {
        if (step < STEPS.length - 1) {
            setStep(step + 1);
        }
    };

    const handleComplete = async () => {
        if (!userId) return;
        setLoading(true);

        const { error } = await supabase
            .from("profiles")
            .update({
                display_name: displayName,
                university,
                faculty,
                grade,
                interests,
                goal,
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
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Display Name</label>
                                    <Input
                                        placeholder="Your name"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">University</label>
                                    <Input
                                        placeholder="e.g., University of Tokyo"
                                        value={university}
                                        onChange={(e) => setUniversity(e.target.value)}
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
                                <p className="text-xs text-muted-foreground">
                                    Selected: {interests.length > 0 ? interests.join(", ") : "None"}
                                </p>
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
        </div>
    );
}
