// Chat System Types

export type MessageKind = 'normal' | 'system';

export interface Message {
    id: string;
    room_id: string;
    user_id: string | null;
    kind: MessageKind;
    content: string | null;
    has_attachments: boolean;
    has_links: boolean;
    created_at: string;
    edited_at: string | null;
    deleted_at: string | null;
    // Joined data
    profiles?: {
        id: string;
        display_name: string | null;
        avatar_url: string | null;
    } | null;
    attachments?: MessageAttachment[];
    links?: MessageLink[];
    reactions?: ReactionGroup[];
    thread?: Thread | null;
}

export interface MessageAttachment {
    id: string;
    message_id: string;
    storage_path: string;
    width: number | null;
    height: number | null;
    mime_type: string | null;
    created_at: string;
    public_url?: string;
}

export interface MessageLink {
    id: string;
    message_id: string;
    url: string;
    og_title: string | null;
    og_description: string | null;
    og_image_url: string | null;
    domain: string | null;
    created_at: string;
}

export interface Thread {
    id: string;
    root_message_id: string;
    reply_count: number;
    last_reply_at: string | null;
    created_at: string;
}

export interface ThreadMessage {
    id: string;
    thread_id: string;
    user_id: string;
    content: string | null;
    has_attachments: boolean;
    has_links: boolean;
    created_at: string;
    edited_at: string | null;
    deleted_at: string | null;
    // Joined data
    profiles?: {
        id: string;
        display_name: string | null;
        avatar_url: string | null;
    } | null;
    reactions?: ReactionGroup[];
}

export interface Reaction {
    id: string;
    message_id: string | null;
    thread_message_id: string | null;
    user_id: string;
    emoji: string;
    created_at: string;
}

export interface ReactionGroup {
    emoji: string;
    count: number;
    users: string[];
    hasReacted: boolean;
}

// Input types
export interface SendMessageInput {
    room_id: string;
    content: string;
    attachments?: File[];
}

export interface SendThreadMessageInput {
    thread_id: string;
    content: string;
}

// Search types
export interface ChatSearchFilters {
    query: string;
    senderId?: string;
    dateFrom?: string;
    dateTo?: string;
    hasImages?: boolean;
    hasLinks?: boolean;
}

export interface ChatSearchResult {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    profiles?: {
        display_name: string | null;
        avatar_url: string | null;
    } | null;
    is_thread_message: boolean;
    thread_id?: string;
    root_message_id?: string;
}

// Translation types
export interface TranslationRequest {
    text: string;
    targetLanguage: 'en' | 'ja' | 'ko' | 'zh';
}

export interface TranslationResponse {
    translated: string;
}

// Link preview types
export interface LinkPreviewRequest {
    url: string;
    messageId: string;
}

export interface LinkPreviewResponse {
    url: string;
    og_title: string | null;
    og_description: string | null;
    og_image_url: string | null;
    domain: string | null;
}

// DM Types
export interface DMConversation {
    id: string;
    participant1_id: string;
    participant2_id: string;
    last_message_at: string | null;
    created_at: string;
    // Joined data
    other_user?: {
        id: string;
        display_name: string | null;
        avatar_url: string | null;
    } | null;
    last_message?: DMMessage | null;
    unread_count?: number;
}

export interface DMMessage {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string | null;
    has_attachments: boolean;
    has_links: boolean;
    created_at: string;
    edited_at: string | null;
    deleted_at: string | null;
    // Joined data
    profiles?: {
        id: string;
        display_name: string | null;
        avatar_url: string | null;
    } | null;
    attachments?: DMMessageAttachment[];
    links?: DMMessageLink[];
    reactions?: ReactionGroup[];
}

export interface DMMessageAttachment {
    id: string;
    message_id: string;
    storage_path: string;
    width: number | null;
    height: number | null;
    mime_type: string | null;
    created_at: string;
    public_url?: string;
}

export interface DMMessageLink {
    id: string;
    message_id: string;
    url: string;
    title: string | null;
    description: string | null;
    image_url: string | null;
    site_name: string | null;
    fetched_at: string | null;
    created_at: string;
}

export interface DMReadStatus {
    id: string;
    conversation_id: string;
    user_id: string;
    last_read_at: string;
}
