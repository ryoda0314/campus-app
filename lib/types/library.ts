// Library System Types

// =====================================================
// Input Types (Sources)
// =====================================================

export type InputType = 'url' | 'pdf' | 'paste';

export interface Source {
    id: string;
    user_id: string;
    input_type: InputType;
    url: string | null;
    file_path: string | null;
    raw_text: string | null;
    created_at: string;
}

// =====================================================
// Library Items (Transformed cards)
// =====================================================

export type ItemStatus = 'processing' | 'ready' | 'failed';

// AIが自由に構成を決められるセクション
export interface ContentSection {
    heading: string;  // セクション見出し（例：「背景」「仕組み」「使い方」など）
    content: string;  // そのセクションの本文（文章形式）
}

// Highlight type for marking important text
export interface Highlight {
    id: string;
    section_index: number;
    start: number;
    end: number;
    color: 'yellow' | 'green' | 'pink' | 'blue';
    note?: string;
}

export interface LibraryItem {
    id: string;
    user_id: string;
    source_id: string | null;
    status: ItemStatus;
    title: string;
    tldr: string | null;
    sections: ContentSection[];  // AIが構成を決めた柔軟なセクション
    personal_note: string | null;
    prompt_version: string | null;
    model_name: string | null;
    highlights: Highlight[];  // Text highlights
    created_at: string;
    updated_at: string;
    // Joined data
    tags?: TagWithOrigin[];
}

export interface LibraryItemWithSource extends LibraryItem {
    source?: Source | null;
}

// =====================================================
// Tags
// =====================================================

export type TagNamespace =
    | 'browse'
    | 'facet'
    | 'prompt'
    | 'api'
    | 'model'
    | 'impl'
    | 'stack'
    | 'status'
    | 'impact'
    | 'entity'
    | 'topic';

export interface Tag {
    id: string;
    name: string;
    namespace: TagNamespace;
    parent_tag_id: string | null;
    is_fixed: boolean;
    description: string | null;
    created_at: string;
}

export interface TagAlias {
    id: string;
    tag_id: string;
    alias: string;
    created_at: string;
}

export type TagOrigin = 'fixed' | 'ai_existing' | 'ai_new' | 'user';

export interface TagWithOrigin extends Tag {
    origin: TagOrigin;
    confidence?: number | null;
}

export interface LibraryItemTag {
    id: string;
    library_item_id: string;
    tag_id: string;
    origin: TagOrigin;
    confidence: number | null;
    created_at: string;
}

// =====================================================
// Transform API Types
// =====================================================

export interface TransformRequest {
    raw_text: string;
    source_url?: string;
    existing_tags: string[]; // tag names for AI reference
}

export interface TransformResult {
    title: string;
    tldr: string;
    sections: { heading: string; content: string }[];  // AIが構成を決めたセクション
    tags: {
        assign_existing: string[];
        propose_new: string[];
    };
}

export interface TransformResponse {
    success: boolean;
    result?: TransformResult;
    error?: string;
}

// =====================================================
// UI State Types
// =====================================================

export type BrowseCategory = 'prompt' | 'api' | 'model' | 'implementation' | 'notes';

export interface BrowseFilter {
    category?: BrowseCategory;
    tags?: string[];
    search?: string;
}

export interface LibraryState {
    items: LibraryItem[];
    loading: boolean;
    error: string | null;
    filter: BrowseFilter;
}

// =====================================================
// Create/Update Types
// =====================================================

export interface CreateSourceInput {
    input_type: InputType;
    url?: string;
    file_path?: string;
    raw_text?: string;
}

export interface CreateLibraryItemInput {
    source_id?: string;
    title: string;
    tldr?: string;
    sections?: { heading: string; content: string }[];
    personal_note?: string;
    tag_ids?: {
        tag_id: string;
        origin: TagOrigin;
        confidence?: number;
    }[];
}

export interface UpdateLibraryItemInput {
    title?: string;
    tldr?: string;
    sections?: { heading: string; content: string }[];
    personal_note?: string;
    status?: ItemStatus;
}

export interface CreateTagInput {
    name: string;
    namespace: 'entity' | 'topic'; // Only entity/topic can be created
    description?: string;
}
