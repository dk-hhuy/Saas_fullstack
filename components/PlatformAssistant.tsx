"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { Bot, Loader2, MessageCircle, Send, Trash2, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { appImages } from "@/constants/images";
import {
  ASSISTANT_MAX_MESSAGE_CHARS,
  ASSISTANT_STORAGE_KEY,
} from "@/constants/platform-assistant";
import type { AssistantChatMessage } from "@/lib/platform-assistant/gemini";
import { cn } from "@/lib/utils";

function loadStoredMessages(): AssistantChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ASSISTANT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AssistantChatMessage[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string"
    );
  } catch {
    return [];
  }
}

function saveMessages(messages: AssistantChatMessage[]) {
  window.localStorage.setItem(ASSISTANT_STORAGE_KEY, JSON.stringify(messages));
}

const PlatformAssistant = () => {
  const t = useTranslations("assistant");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMessages(loadStoredMessages());
  }, []);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    inputRef.current?.focus();
  }, [open, messages, loading]);

  const persist = useCallback((next: AssistantChatMessage[]) => {
    setMessages(next);
    saveMessages(next);
  }, []);

  const clearChat = () => {
    persist([]);
    setError(null);
    setInput("");
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setError(null);
    setInput("");
    setLoading(true);

    const userMessage: AssistantChatMessage = { role: "user", content: text };
    const historyWithUser = [...messages, userMessage];
    persist(historyWithUser);

    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages,
          locale,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        reply?: string;
        error?: string;
        retryAfterSec?: number;
      };

      if (!response.ok) {
        const rateMsg =
          response.status === 429 && data.retryAfterSec
            ? t("rateLimited", { seconds: data.retryAfterSec })
            : null;
        throw new Error(rateMsg ?? data.error ?? t("sendError"));
      }

      if (!data.reply) {
        throw new Error(t("sendError"));
      }

      persist([...historyWithUser, { role: "assistant", content: data.reply }]);
    } catch (err) {
      persist(messages);
      setInput(text);
      setError(err instanceof Error ? err.message : t("sendError"));
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "fixed bottom-20 right-4 z-[90] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:bottom-6 md:right-6",
          open && "scale-95"
        )}
        aria-expanded={open}
        aria-controls="platform-assistant-panel"
        aria-label={open ? t("close") : t("open")}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {open && (
        <div
          id="platform-assistant-panel"
          role="dialog"
          aria-labelledby="platform-assistant-title"
          className="fixed bottom-[5.5rem] right-4 z-[90] flex w-[min(100vw-1.5rem,32rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:w-[min(100vw-2rem,36rem)] md:bottom-24 md:right-6"
        >
          <header className="flex items-center gap-3 border-b border-border bg-muted/50 px-4 py-3">
            <Image
              src={appImages.logo}
              alt=""
              width={36}
              height={36}
              className="rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <h2 id="platform-assistant-title" className="truncate text-sm font-semibold">
                {t("title")}
              </h2>
              <p className="truncate text-xs text-muted-foreground">{t("subtitle")}</p>
            </div>
            <button
              type="button"
              onClick={clearChat}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={t("clear")}
              title={t("clear")}
            >
              <Trash2 size={16} />
            </button>
          </header>

          <div ref={listRef} className="flex max-h-[min(55vh,28rem)] flex-col gap-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
                <Bot size={28} className="text-primary/70" />
                <p>{t("welcome")}</p>
                <ul className="mt-1 space-y-1 text-left text-xs">
                  <li>• {t("suggestion1")}</li>
                  <li>• {t("suggestion2")}</li>
                  <li>• {t("suggestion3")}</li>
                </ul>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={cn(
                  "rounded-2xl px-3 py-2 text-sm leading-relaxed",
                  message.role === "user"
                    ? "ml-auto max-w-[88%] bg-primary text-primary-foreground"
                    : "mr-auto w-full bg-muted text-foreground"
                )}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            ))}

            {loading && (
              <div className="mr-auto flex items-center gap-2 rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                <Loader2 size={16} className="animate-spin" />
                {t("thinking")}
              </div>
            )}
          </div>

          {error && (
            <p className="px-4 pb-2 text-xs text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="border-t border-border p-3">
            <SignedOut>
              <div className="flex flex-col items-center gap-2 py-2 text-center text-sm">
                <p className="text-muted-foreground">{t("signInPrompt")}</p>
                <SignInButton mode="modal">
                  <button type="button" className="btn-primary text-sm">
                    {t("signIn")}
                  </button>
                </SignInButton>
              </div>
            </SignedOut>

            <SignedIn>
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={t("placeholder")}
                  rows={2}
                  maxLength={ASSISTANT_MAX_MESSAGE_CHARS}
                  disabled={loading}
                  className="input min-h-[2.75rem] flex-1 resize-none px-3 py-2.5 text-sm leading-normal"
                  aria-label={t("placeholder")}
                />
                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={loading || !input.trim()}
                  className="btn-primary flex h-11 w-11 shrink-0 items-center justify-center !gap-0 !p-0 disabled:opacity-50"
                  aria-label={t("send")}
                >
                  <Send size={18} className="shrink-0" />
                </button>
              </div>
            </SignedIn>
          </div>
        </div>
      )}
    </>
  );
};

export default PlatformAssistant;
