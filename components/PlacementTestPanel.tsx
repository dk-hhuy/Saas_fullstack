"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { subjects } from "@/constants";
import { getSubjectColor } from "@/lib/utils";
import {
  generatePlacementTest,
  savePlacementResult,
} from "@/lib/actions/assessment.actions";
import type { PlacementLevel } from "@/lib/assessment-level";
import SessionQuiz from "@/components/SessionQuiz";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "setup" | "quiz" | "result";

const levelBadgeClass: Record<PlacementLevel, string> = {
  beginner: "bg-green-600/15 text-green-700 dark:text-green-400",
  intermediate: "bg-amber-600/15 text-amber-700 dark:text-amber-400",
  advanced: "bg-primary/15 text-primary",
};

const PlacementTestPanel = () => {
  const t = useTranslations("assessment");
  const [step, setStep] = useState<Step>("setup");
  const [subject, setSubject] = useState(subjects[0] ?? "maths");
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    score: number;
    total: number;
    recommended_level: PlacementLevel;
  } | null>(null);
  const attemptIdRef = useRef<string | null>(null);
  const savedAttemptRef = useRef(false);

  const reset = () => {
    setStep("setup");
    setQuestions(null);
    setResult(null);
    setError(null);
    attemptIdRef.current = null;
    savedAttemptRef.current = false;
  };

  const handleStart = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await generatePlacementTest(subject, topic || undefined);

      if (response.skipped) {
        setError(t("noApiKey"));
        return;
      }

      setQuestions(response.questions);
      attemptIdRef.current = crypto.randomUUID();
      savedAttemptRef.current = false;
      setStep("quiz");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("generateError"));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (answers: Record<number, number>) => {
    if (!questions || savedAttemptRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const saved = await savePlacementResult({
        subject,
        topic: topic || undefined,
        questions,
        answers,
        attemptId: attemptIdRef.current ?? undefined,
      });

      savedAttemptRef.current = true;
      setResult(saved);
      setStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("saveError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section-card flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">{t("placementTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("placementDesc")}</p>
      </div>

      {step === "setup" && (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium">{t("subjectLabel")}</span>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s} value={s}>
                      <span className="capitalize">{s}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium">{t("topicLabel")}</span>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={t("topicPlaceholder")}
              />
            </label>
          </div>

          <button
            type="button"
            className="btn-primary w-fit"
            disabled={loading}
            onClick={handleStart}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" aria-hidden />
            ) : (
              <Sparkles size={16} aria-hidden />
            )}
            {t("startPlacement")}
          </button>
        </div>
      )}

      {step === "quiz" && questions && (
        <SessionQuiz
          questions={questions}
          submitLabel={t("submitPlacement")}
          onSubmit={handleSubmit}
          submitting={loading}
        />
      )}

      {step === "result" && result && (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-border bg-muted/40 p-6">
            <p className="text-sm text-muted-foreground">{t("yourScore")}</p>
            <p className="text-3xl font-bold">
              {result.score} / {result.total}
            </p>
            <p className="mt-3 text-sm">
              {t("recommendedLevel")}{" "}
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                  levelBadgeClass[result.recommended_level]
                )}
              >
                {t(`level.${result.recommended_level}`)}
              </span>
            </p>
            <p
              className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize"
              style={{ backgroundColor: `${getSubjectColor(subject)}40` }}
            >
              {subject}
              {topic ? ` · ${topic}` : ""}
            </p>
          </div>

          <button type="button" className="btn-secondary w-fit" onClick={reset}>
            {t("takeAnother")}
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </section>
  );
};

export default PlacementTestPanel;
