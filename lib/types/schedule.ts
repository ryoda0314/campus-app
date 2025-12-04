export type ScheduleEvent = {
    id: string;
    title: string;
    description?: string | null;
    datetime: string; // ISO string
    location?: string | null;
    user_id: string;
    created_at: string;
};

export type ParsedScheduleEvent = {
    title: string;
    datetime: string;
    location?: string | null;
    notes?: string | null;
};
