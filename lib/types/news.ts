// News Hub Types

export type NewsCategory = 'notice' | 'event' | 'recruit' | 'lost' | 'study' | 'external';
export type NewsVisibility = 'public' | 'room';
export type DigestLang = 'jp' | 'en' | 'kr' | 'cn';

// Campus News Post
export interface NewsPost {
    id: string;
    author_id: string;
    title: string;
    body: string | null;
    category: NewsCategory;
    visibility: NewsVisibility;
    room_id: string | null;
    pinned_until: string | null;
    expires_at: string | null;
    library_item_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface NewsPostWithAuthor extends NewsPost {
    author: {
        id: string;
        display_name: string | null;
        avatar_url: string | null;
    };
}

// External Digest Item
export interface DigestItem {
    id: string;  // sha256 hex
    url: string;
    title: string;
    source: string;
    company: string | null;
    category: string | null;
    published_at: string;
    importance: number;
    raw_excerpt: string | null;
    created_at: string;
}

export interface DigestSummary {
    id: string;
    digest_id: string;
    lang: DigestLang;
    summary_short: string;
    summary_long: string | null;
    tags: string[] | null;
    generated_at: string;
    model_name: string | null;
}

export interface DigestItemWithSummary extends DigestItem {
    summary?: DigestSummary;
}

export interface DigestDailyMemo {
    id: string;
    date: string;
    lang: DigestLang;
    memo_text: string;
    generated_at: string;
    model_name: string | null;
}

// API Request/Response Types
export interface CreateNewsPostRequest {
    title: string;
    body?: string;
    category?: NewsCategory;
    visibility?: NewsVisibility;
    room_id?: string;
    pinned_until?: string;
    expires_at?: string;
}

export interface UpdateNewsPostRequest {
    title?: string;
    body?: string;
    category?: NewsCategory;
    visibility?: NewsVisibility;
    room_id?: string;
    pinned_until?: string | null;
    expires_at?: string | null;
}

export interface NewsListResponse {
    items: NewsPostWithAuthor[] | DigestItemWithSummary[];
    memo?: DigestDailyMemo;
    nextCursor?: string;
}

export interface NewsCursor {
    created_at: string;
    id: string;
}
