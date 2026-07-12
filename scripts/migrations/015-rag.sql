-- C1: PDF documents + vector embeddings for companion RAG

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.companion_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  companion_id uuid NOT NULL REFERENCES public.companions(id) ON DELETE CASCADE,
  author varchar NOT NULL,
  file_name text NOT NULL,
  storage_path text NOT NULL,
  page_count integer,
  chunk_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'ready', 'failed')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_companion_documents_companion
  ON public.companion_documents (companion_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.companion_documents(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL CHECK (chunk_index >= 0),
  content text NOT NULL,
  embedding vector(768),
  token_count integer,
  UNIQUE (document_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_document_chunks_document
  ON public.document_chunks (document_id, chunk_index);

CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
  ON public.document_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 16);

ALTER TABLE public.companion_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "companion_documents_select" ON public.companion_documents;
CREATE POLICY "companion_documents_select" ON public.companion_documents
  FOR SELECT TO authenticated
  USING (
    author = (auth.jwt() ->> 'sub')
    OR EXISTS (
      SELECT 1 FROM public.companions c
      WHERE c.id = companion_documents.companion_id
        AND c.is_public = true
    )
  );

DROP POLICY IF EXISTS "companion_documents_insert" ON public.companion_documents;
CREATE POLICY "companion_documents_insert" ON public.companion_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    author = (auth.jwt() ->> 'sub')
    AND EXISTS (
      SELECT 1 FROM public.companions c
      WHERE c.id = companion_documents.companion_id
        AND c.author = (auth.jwt() ->> 'sub')
    )
  );

DROP POLICY IF EXISTS "companion_documents_update" ON public.companion_documents;
CREATE POLICY "companion_documents_update" ON public.companion_documents
  FOR UPDATE TO authenticated
  USING (author = (auth.jwt() ->> 'sub'))
  WITH CHECK (author = (auth.jwt() ->> 'sub'));

DROP POLICY IF EXISTS "companion_documents_delete" ON public.companion_documents;
CREATE POLICY "companion_documents_delete" ON public.companion_documents
  FOR DELETE TO authenticated
  USING (author = (auth.jwt() ->> 'sub'));

DROP POLICY IF EXISTS "document_chunks_select" ON public.document_chunks;
CREATE POLICY "document_chunks_select" ON public.document_chunks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companion_documents cd
      WHERE cd.id = document_chunks.document_id
        AND (
          cd.author = (auth.jwt() ->> 'sub')
          OR EXISTS (
            SELECT 1 FROM public.companions c
            WHERE c.id = cd.companion_id AND c.is_public = true
          )
        )
    )
  );

DROP POLICY IF EXISTS "document_chunks_insert" ON public.document_chunks;
CREATE POLICY "document_chunks_insert" ON public.document_chunks
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.companion_documents cd
      WHERE cd.id = document_chunks.document_id
        AND cd.author = (auth.jwt() ->> 'sub')
    )
  );

DROP POLICY IF EXISTS "document_chunks_delete" ON public.document_chunks;
CREATE POLICY "document_chunks_delete" ON public.document_chunks
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companion_documents cd
      WHERE cd.id = document_chunks.document_id
        AND cd.author = (auth.jwt() ->> 'sub')
    )
  );

GRANT ALL ON TABLE public.companion_documents TO authenticated, service_role;
GRANT ALL ON TABLE public.document_chunks TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.match_document_chunks(
  p_companion_id uuid,
  p_query_embedding vector(768),
  p_match_count integer DEFAULT 5
)
RETURNS TABLE (
  chunk_id uuid,
  content text,
  similarity double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    dc.id AS chunk_id,
    dc.content,
    1 - (dc.embedding <=> p_query_embedding) AS similarity
  FROM public.document_chunks dc
  INNER JOIN public.companion_documents cd ON cd.id = dc.document_id
  WHERE cd.companion_id = p_companion_id
    AND cd.status = 'ready'
    AND dc.embedding IS NOT NULL
  ORDER BY dc.embedding <=> p_query_embedding
  LIMIT GREATEST(1, LEAST(p_match_count, 20));
$$;

GRANT EXECUTE ON FUNCTION public.match_document_chunks(uuid, vector, integer)
  TO authenticated, service_role;

-- Supabase Storage bucket for companion PDFs (private, 10 MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'companion-docs',
  'companion-docs',
  false,
  10485760,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "companion_docs_insert_own" ON storage.objects;
CREATE POLICY "companion_docs_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'companion-docs'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
  );

DROP POLICY IF EXISTS "companion_docs_select_own" ON storage.objects;
CREATE POLICY "companion_docs_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'companion-docs'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
  );

DROP POLICY IF EXISTS "companion_docs_delete_own" ON storage.objects;
CREATE POLICY "companion_docs_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'companion-docs'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
  );
