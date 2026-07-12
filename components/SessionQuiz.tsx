"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface SessionQuizProps {
  questions: QuizQuestion[];
}

const SessionQuiz = ({ questions }: SessionQuizProps) => {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = submitted
    ? questions.reduce(
        (total, q, index) =>
          total + (answers[index] === q.correctIndex ? 1 : 0),
        0
      )
    : 0;

  return (
    <div className="flex flex-col gap-6">
      {questions.map((question, qIndex) => (
        <fieldset key={qIndex} className="flex flex-col gap-3">
          <legend className="text-sm font-medium">
            {qIndex + 1}. {question.question}
          </legend>
          <ul className="flex flex-col gap-2">
            {question.options.map((option, oIndex) => {
              const isSelected = answers[qIndex] === oIndex;
              const isCorrect = oIndex === question.correctIndex;
              const showResult = submitted;

              return (
                <li key={oIndex}>
                  <button
                    type="button"
                    disabled={submitted}
                    onClick={() =>
                      setAnswers((prev) => ({ ...prev, [qIndex]: oIndex }))
                    }
                    className={cn(
                      "w-full rounded-xl border px-4 py-2.5 text-left text-sm transition-colors",
                      !showResult &&
                        isSelected &&
                        "border-primary bg-primary/10",
                      !showResult && !isSelected && "border-border hover:bg-muted",
                      showResult &&
                        isCorrect &&
                        "border-green-600 bg-green-600/10",
                      showResult &&
                        isSelected &&
                        !isCorrect &&
                        "border-red-600 bg-red-600/10",
                      showResult &&
                        !isSelected &&
                        !isCorrect &&
                        "border-border opacity-60"
                    )}
                  >
                    {option}
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset>
      ))}

      {!submitted ? (
        <button
          type="button"
          className="btn-primary w-fit"
          disabled={Object.keys(answers).length < questions.length}
          onClick={() => setSubmitted(true)}
        >
          Check answers
        </button>
      ) : (
        <p className="text-sm font-medium">
          You scored {score} / {questions.length}
        </p>
      )}
    </div>
  );
};

export default SessionQuiz;
