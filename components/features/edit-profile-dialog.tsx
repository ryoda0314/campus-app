"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { Edit } from "lucide-react";

interface EditProfileDialogProps {
    profile: {
        id: string;
        display_name: string | null;
        university: string | null;
        faculty: string | null;
        grade: string | null;
        goal: string | null;
    };
}

export function EditProfileDialog({ profile }: EditProfileDialogProps) {
    const [open, setOpen] = useState(false);
    const [displayName, setDisplayName] = useState(profile.display_name || "");
    const [university, setUniversity] = useState(profile.university || "");
    const [faculty, setFaculty] = useState(profile.faculty || "");
    const [grade, setGrade] = useState(profile.grade || "");
    const [goal, setGoal] = useState(profile.goal || "");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

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
            })
            .eq("id", profile.id);

        if (!error) {
            setOpen(false);
            router.refresh();
        }

        setLoading(false);
    };

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
                    <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                            id="displayName"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Your name"
                        />
                    </div>
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
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Saving..." : "Save Changes"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
