-- =====================================================
-- Library Tags Seed Data
-- Initial fixed tags for the tag hierarchy
-- =====================================================

-- =====================================================
-- Browse Entry Tags (UI Level 0)
-- =====================================================
INSERT INTO tags (name, namespace, is_fixed, description) VALUES
    ('browse:prompt', 'browse', true, 'Browse entry: Prompt engineering'),
    ('browse:api', 'browse', true, 'Browse entry: API specifications'),
    ('browse:model', 'browse', true, 'Browse entry: AI models'),
    ('browse:implementation', 'browse', true, 'Browse entry: Implementation patterns'),
    ('browse:notes', 'browse', true, 'Browse entry: Personal notes')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- Facet Tags (Structural framework)
-- =====================================================

-- facet:what
INSERT INTO tags (name, namespace, is_fixed, description) VALUES
    ('facet:what:prompt', 'facet', true, 'What: Prompt'),
    ('facet:what:api', 'facet', true, 'What: API'),
    ('facet:what:model', 'facet', true, 'What: Model'),
    ('facet:what:implementation', 'facet', true, 'What: Implementation'),
    ('facet:what:note', 'facet', true, 'What: Note'),
    ('facet:what:concept', 'facet', true, 'What: Concept'),
    ('facet:what:tool', 'facet', true, 'What: Tool')
ON CONFLICT (name) DO NOTHING;

-- facet:role
INSERT INTO tags (name, namespace, is_fixed, description) VALUES
    ('facet:role:extraction', 'facet', true, 'Role: Information extraction'),
    ('facet:role:generation', 'facet', true, 'Role: Content generation'),
    ('facet:role:evaluation', 'facet', true, 'Role: Evaluation/assessment'),
    ('facet:role:transformation', 'facet', true, 'Role: Data transformation'),
    ('facet:role:automation', 'facet', true, 'Role: Task automation')
ON CONFLICT (name) DO NOTHING;

-- facet:function
INSERT INTO tags (name, namespace, is_fixed, description) VALUES
    ('facet:function:ingest', 'facet', true, 'Function: Data ingestion'),
    ('facet:function:transform', 'facet', true, 'Function: Data transformation'),
    ('facet:function:tagging', 'facet', true, 'Function: Tagging/classification'),
    ('facet:function:retrieve', 'facet', true, 'Function: Data retrieval'),
    ('facet:function:reuse', 'facet', true, 'Function: Content reuse'),
    ('facet:function:governance', 'facet', true, 'Function: Governance/control')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- Prompt Shelf Tags
-- =====================================================

-- prompt:intent
INSERT INTO tags (name, namespace, is_fixed, description) VALUES
    ('prompt:intent:extraction', 'prompt', true, 'Intent: Information extraction'),
    ('prompt:intent:generation', 'prompt', true, 'Intent: Content generation'),
    ('prompt:intent:evaluation', 'prompt', true, 'Intent: Evaluation/scoring')
ON CONFLICT (name) DO NOTHING;

-- prompt:format
INSERT INTO tags (name, namespace, is_fixed, description) VALUES
    ('prompt:format:system', 'prompt', true, 'Format: System prompt'),
    ('prompt:format:user', 'prompt', true, 'Format: User prompt'),
    ('prompt:format:structured-output', 'prompt', true, 'Format: Structured output')
ON CONFLICT (name) DO NOTHING;

-- prompt:maturity
INSERT INTO tags (name, namespace, is_fixed, description) VALUES
    ('prompt:maturity:stable', 'prompt', true, 'Maturity: Production-ready'),
    ('prompt:maturity:experimental', 'prompt', true, 'Maturity: Experimental')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- API Shelf Tags
-- =====================================================

-- api:type
INSERT INTO tags (name, namespace, is_fixed, description) VALUES
    ('api:type:responses', 'api', true, 'Type: Responses API'),
    ('api:type:chat', 'api', true, 'Type: Chat Completions API'),
    ('api:type:embeddings', 'api', true, 'Type: Embeddings API'),
    ('api:type:vision', 'api', true, 'Type: Vision API'),
    ('api:type:tts', 'api', true, 'Type: Text-to-Speech API'),
    ('api:type:stt', 'api', true, 'Type: Speech-to-Text API'),
    ('api:type:realtime', 'api', true, 'Type: Realtime API'),
    ('api:type:batch', 'api', true, 'Type: Batch API')
ON CONFLICT (name) DO NOTHING;

-- api:constraint
INSERT INTO tags (name, namespace, is_fixed, description) VALUES
    ('api:constraint:cost', 'api', true, 'Constraint: Cost consideration'),
    ('api:constraint:latency', 'api', true, 'Constraint: Latency consideration'),
    ('api:constraint:rate-limits', 'api', true, 'Constraint: Rate limits'),
    ('api:constraint:context-window', 'api', true, 'Constraint: Context window size'),
    ('api:constraint:streaming', 'api', true, 'Constraint: Streaming support')
ON CONFLICT (name) DO NOTHING;

-- api:usage
INSERT INTO tags (name, namespace, is_fixed, description) VALUES
    ('api:usage:production', 'api', true, 'Usage: Production workload'),
    ('api:usage:prototype', 'api', true, 'Usage: Prototyping'),
    ('api:usage:eval', 'api', true, 'Usage: Evaluation/testing'),
    ('api:usage:automation', 'api', true, 'Usage: Automation')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- Model Shelf Tags
-- =====================================================

-- model:provider
INSERT INTO tags (name, namespace, is_fixed, description) VALUES
    ('model:provider:openai', 'model', true, 'Provider: OpenAI'),
    ('model:provider:google', 'model', true, 'Provider: Google'),
    ('model:provider:anthropic', 'model', true, 'Provider: Anthropic')
ON CONFLICT (name) DO NOTHING;

-- model:modality
INSERT INTO tags (name, namespace, is_fixed, description) VALUES
    ('model:modality:text', 'model', true, 'Modality: Text'),
    ('model:modality:vision', 'model', true, 'Modality: Vision/Image'),
    ('model:modality:audio', 'model', true, 'Modality: Audio')
ON CONFLICT (name) DO NOTHING;

-- model:capability
INSERT INTO tags (name, namespace, is_fixed, description) VALUES
    ('model:capability:reasoning', 'model', true, 'Capability: Advanced reasoning'),
    ('model:capability:fast', 'model', true, 'Capability: Fast inference'),
    ('model:capability:cheap', 'model', true, 'Capability: Cost-efficient'),
    ('model:capability:long-context', 'model', true, 'Capability: Long context window')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- Implementation Shelf Tags
-- =====================================================

-- impl:area
INSERT INTO tags (name, namespace, is_fixed, description) VALUES
    ('impl:area:frontend', 'impl', true, 'Area: Frontend'),
    ('impl:area:backend', 'impl', true, 'Area: Backend'),
    ('impl:area:database', 'impl', true, 'Area: Database'),
    ('impl:area:infra', 'impl', true, 'Area: Infrastructure'),
    ('impl:area:security', 'impl', true, 'Area: Security')
ON CONFLICT (name) DO NOTHING;

-- impl:pattern
INSERT INTO tags (name, namespace, is_fixed, description) VALUES
    ('impl:pattern:async-jobs', 'impl', true, 'Pattern: Async jobs'),
    ('impl:pattern:webhook', 'impl', true, 'Pattern: Webhooks'),
    ('impl:pattern:cache', 'impl', true, 'Pattern: Caching'),
    ('impl:pattern:rls', 'impl', true, 'Pattern: Row Level Security')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- Stack Tags (Fixed dictionary)
-- =====================================================
INSERT INTO tags (name, namespace, is_fixed, description) VALUES
    ('stack:nextjs', 'stack', true, 'Stack: Next.js'),
    ('stack:supabase', 'stack', true, 'Stack: Supabase'),
    ('stack:vercel', 'stack', true, 'Stack: Vercel'),
    ('stack:cloud-run', 'stack', true, 'Stack: Google Cloud Run'),
    ('stack:playwright', 'stack', true, 'Stack: Playwright')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- Notes Shelf Tags (Status & Impact)
-- =====================================================

-- status
INSERT INTO tags (name, namespace, is_fixed, description) VALUES
    ('status:seed', 'status', true, 'Status: Seed idea'),
    ('status:todo', 'status', true, 'Status: To do'),
    ('status:validated', 'status', true, 'Status: Validated'),
    ('status:deprecated', 'status', true, 'Status: Deprecated')
ON CONFLICT (name) DO NOTHING;

-- impact
INSERT INTO tags (name, namespace, is_fixed, description) VALUES
    ('impact:high', 'impact', true, 'Impact: High'),
    ('impact:mid', 'impact', true, 'Impact: Medium'),
    ('impact:low', 'impact', true, 'Impact: Low')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- Topic Tags (Initial set - can grow)
-- =====================================================
INSERT INTO tags (name, namespace, is_fixed, description) VALUES
    ('topic:cost-optimization', 'topic', false, 'Topic: Cost optimization'),
    ('topic:structured-output', 'topic', false, 'Topic: Structured output'),
    ('topic:information-extraction', 'topic', false, 'Topic: Information extraction'),
    ('topic:prompt-engineering', 'topic', false, 'Topic: Prompt engineering'),
    ('topic:eval', 'topic', false, 'Topic: Evaluation'),
    ('topic:retrieval', 'topic', false, 'Topic: Retrieval/RAG'),
    ('topic:security', 'topic', false, 'Topic: Security'),
    ('topic:ui-ux', 'topic', false, 'Topic: UI/UX'),
    ('topic:campus-app', 'topic', false, 'Topic: Campus App specific')
ON CONFLICT (name) DO NOTHING;
