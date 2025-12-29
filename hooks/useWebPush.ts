"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { urlBase64ToUint8Array } from "@/lib/utils";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export function useWebPush() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        // Check if already subscribed
        const checkSubscription = async () => {
            if (!("serviceWorker" in navigator)) return;

            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        };

        checkSubscription();
    }, []);

    const subscribe = async () => {
        if (!("serviceWorker" in navigator)) {
            console.error("Service Worker not supported");
            return false;
        }

        if (!VAPID_PUBLIC_KEY) {
            console.error("VAPID_PUBLIC_KEY is missing");
            return false;
        }

        setLoading(true);

        try {
            const registration = await navigator.serviceWorker.ready;

            // Subscribe to push
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            // Save subscription to Supabase
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Remove existing same endpoint to avoid duplicates
                await supabase
                    .from("push_subscriptions")
                    .delete()
                    .eq("endpoint", subscription.endpoint);

                const { error } = await supabase
                    .from("push_subscriptions")
                    .insert({
                        user_id: user.id,
                        endpoint: subscription.endpoint,
                        p256dh: subscription.toJSON().keys?.p256dh || "",
                        auth: subscription.toJSON().keys?.auth || "",
                    });

                if (error) {
                    console.error("Failed to save subscription:", error);
                    return false;
                }
            }

            setIsSubscribed(true);
            return true;
        } catch (error) {
            console.error("Failed to subscribe to Web Push:", error);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const unsubscribe = async () => {
        if (!("serviceWorker" in navigator)) return;

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();

                // Remove from DB (optional, but good practice)
                await supabase
                    .from("push_subscriptions")
                    .delete()
                    .eq("endpoint", subscription.endpoint);

                setIsSubscribed(false);
            }
        } catch (error) {
            console.error("Failed to unsubscribe:", error);
        }
    };

    return {
        isSubscribed,
        subscribe,
        unsubscribe,
        loading,
        isSupported: typeof window !== "undefined" && "serviceWorker" in navigator,
        hasVapidKey: !!VAPID_PUBLIC_KEY
    };
}
