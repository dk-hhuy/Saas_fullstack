-- P1: Append-only session messages (transcript no longer rewritten on every checkpoint)

CREATE TABLE IF NOT EXISTS public.session_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.session_history(id) ON DELETE CASCADE,
  seq integer NOT NULL CHECK (seq > 0),
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, seq)
);

CREATE INDEX IF NOT EXISTS idx_session_messages_session_seq
  ON public.session_messages (session_id, seq);

ALTER TABLE public.session_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "session_messages_select_own" ON public.session_messages;
CREATE POLICY "session_messages_select_own" ON public.session_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.session_history sh
      WHERE sh.id = session_messages.session_id
        AND sh.user_id = (auth.jwt() ->> 'sub')
    )
  );

DROP POLICY IF EXISTS "session_messages_insert_own" ON public.session_messages;
CREATE POLICY "session_messages_insert_own" ON public.session_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.session_history sh
      WHERE sh.id = session_messages.session_id
        AND sh.user_id = (auth.jwt() ->> 'sub')
    )
  );

GRANT ALL ON TABLE public.session_messages TO authenticated, service_role;
