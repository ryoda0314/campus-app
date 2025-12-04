"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { ScheduleEvent } from "@/lib/types/schedule";

export function useSchedule() {
    const [events, setEvents] = useState<ScheduleEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = useMemo(() => createClient(), []);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("schedule_events")
                .select("*")
                .order("datetime", { ascending: true });

            if (error) throw error;
            setEvents(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch events");
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    return { events, loading, error, refetch: fetchEvents };
}

export function useUpcomingSchedule(daysAhead = 7) {
    const [events, setEvents] = useState<ScheduleEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = useMemo(() => createClient(), []);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const now = new Date();
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + daysAhead);

            const { data, error } = await supabase
                .from("schedule_events")
                .select("*")
                .gte("datetime", now.toISOString())
                .lte("datetime", futureDate.toISOString())
                .order("datetime", { ascending: true })
                .limit(5);

            if (error) throw error;
            setEvents(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch events");
        } finally {
            setLoading(false);
        }
    }, [supabase, daysAhead]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    return { events, loading, error, refetch: fetchEvents };
}

export function useAddSchedule() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const addEvent = async (event: Omit<ScheduleEvent, "id" | "created_at">) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/schedule", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(event),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to add event");
            }

            return await res.json();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to add event");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { addEvent, loading, error };
}

export function useDeleteSchedule() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const deleteEvent = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/schedule?id=${id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete event");
            }

            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete event");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { deleteEvent, loading, error };
}
