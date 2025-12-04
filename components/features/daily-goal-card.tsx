"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface DailyGoalCardProps {
    initialGoal?: string;
    userId: string;
}

export function DailyGoalCard({ initialGoal, userId }: DailyGoalCardProps) {
    const [goal, setGoal] = useState(initialGoal || "");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleDeclare = async () => {
        if (!goal.trim()) return;
        setLoading(true);

        const { error } = await supabase
            .from("profiles")
            .update({ goal })
            .eq("id", userId);

        setLoading(false);

        if (error) {
            console.error(error);
            alert("Failed to update goal");
        } else {
            router.refresh();
        }
    };

    return (
        <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
                <CardTitle className="text-lg">Daily Goal</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2">
                    <Input
                        placeholder="What is your main focus today?"
                        className="bg-background"
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                    />
                    <Button onClick={handleDeclare} disabled={loading}>
                        {loading ? "Saving..." : "Declare"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
