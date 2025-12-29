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
    const [success, setSuccess] = useState(false);

    const handleSignup = async () => {
        setLoading(true);
        setError(null);

        if (!email.endsWith(".ac.jp") && !email.endsWith("@gmail.com")) {
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
            setSuccess(true);
        }
    };

    if (success) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Check your email</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        We have sent a verification email to <strong>{email}</strong>.
                        Please check your inbox and click the link to verify your account.
                    </p>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-xs text-muted-foreground">
                        Verified?{" "}
                        <Link href="/login" className="text-primary hover:underline">
                            Login
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        );
    }

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
                        Must be a valid .ac.jp email address (or gmail.com for testing).
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
