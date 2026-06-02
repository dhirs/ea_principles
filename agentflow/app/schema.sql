-- LangGraph checkpoint tables for the Supabase REST checkpointer.
-- Run ONCE in the Supabase dashboard: SQL Editor -> paste -> Run.
-- No database password needed; the SQL editor is dashboard-authenticated.

create table if not exists lg_checkpoints (
    thread_id            text not null,
    checkpoint_ns        text not null default '',
    checkpoint_id        text not null,
    parent_checkpoint_id text,
    type                 text not null,
    checkpoint           text not null,   -- base64 of serialized checkpoint blob
    metadata_type        text,
    metadata             text,            -- base64 of serialized metadata blob
    created_at           timestamptz not null default now(),
    primary key (thread_id, checkpoint_ns, checkpoint_id)
);

create table if not exists lg_writes (
    thread_id     text not null,
    checkpoint_ns text not null default '',
    checkpoint_id text not null,
    task_id       text not null,
    idx           int  not null,
    channel       text not null,
    type          text not null,
    value         text not null,          -- base64 of serialized write value
    primary key (thread_id, checkpoint_ns, checkpoint_id, task_id, idx)
);

-- Access is via the secret API key (service role), which bypasses RLS, so no
-- policies are required. RLS is left disabled on these internal tables.
