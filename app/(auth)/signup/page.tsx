"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleSignup = async () => {
        setLoading(true);
        setError(null);

        if (!email.endsWith(".ac.jp")) {
            setError("Email must be a valid .ac.jp address.");
            setLoading(false);
            return;
        }

        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            // Assuming auto-confirm is off or user needs to check email.
            // For this demo, we might assume auto-confirm or just redirect to onboarding if successful.
            // If email confirmation is required, we should show a message.
            // For now, let's redirect to onboarding.
            router.push("/onboarding");
            router.refresh();
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Sign Up</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {error && <div className="text-red-500 text-sm">{error}</div>}
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none" htmlFor="email">
                        University Email
                    </label>
                    <Input
                        id="email"
                        placeholder="student@university.ac.jp"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <p className="text-[10px] text-muted-foreground">
                        Must be a valid .ac.jp email address.
                    </p>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none" htmlFor="password">
                        Password
                    </label>
                    <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <Button className="w-full mt-4" onClick={handleSignup} disabled={loading}>
                    {loading ? "Creating Account..." : "Create Account"}
                </Button>
            </CardContent>
            <CardFooter className="flex justify-center">
                <p className="text-xs text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary hover:underline">
                        Login
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}
