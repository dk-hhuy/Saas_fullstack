"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { subjects } from "@/constants";
import { SYSTEM_PROMPT_MAX_LENGTH } from "@/constants/vapi-prompts";
import { Textarea } from "./ui/textarea";
import {
  createCompanion,
  updateCompanion,
} from "@/lib/actions/companion.actions";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  SESSION_LOCALE_CODES,
  languageDisplayName,
} from "@/constants/locales";
import { useLocale } from "next-intl";

const formSchema = z.object({
  name: z.string().min(1, { message: "Companion is required." }),
  subject: z.string().min(1, { message: "Subject is required." }),
  topic: z.string().min(1, { message: "Topic is required." }),
  voice: z.string().min(1, { message: "Voice is required." }),
  style: z.string().min(1, { message: "Style is required." }),
  duration: z.number().min(1, { message: "Duration is required." }),
  is_public: z.boolean(),
  system_prompt: z
    .string()
    .max(SYSTEM_PROMPT_MAX_LENGTH, {
      message: `Custom prompt must be at most ${SYSTEM_PROMPT_MAX_LENGTH} characters.`,
    })
    .optional(),
  session_locale: z.enum(SESSION_LOCALE_CODES),
});

type FormValues = z.infer<typeof formSchema>;

interface CompanionFormProps {
  mode?: "create" | "edit";
  companionId?: string;
  initialValues?: Partial<FormValues>;
  submitLabel?: string;
}

const defaultValues: FormValues = {
  name: "",
  subject: "",
  topic: "",
  voice: "",
  style: "",
  duration: 15,
  is_public: false,
  system_prompt: "",
  session_locale: "en",
};

const CompanionForm = ({
  mode = "create",
  companionId,
  initialValues,
  submitLabel,
}: CompanionFormProps) => {
  const router = useRouter();
  const t = useTranslations("companionForm");
  const uiLocale = useLocale();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { ...defaultValues, ...initialValues },
  });

  const isPublic = form.watch("is_public");
  const customPrompt = form.watch("system_prompt") ?? "";

  const onSubmit = async (values: FormValues) => {
    if (mode === "edit" && companionId) {
      await updateCompanion(companionId, values);
      router.push(`/companions/${companionId}`);
    } else {
      const companion = await createCompanion(values);
      if (companion) {
        router.push(`/companions/${companion.id}`);
      } else {
        router.push("/");
      }
    }
    router.refresh();
  };

  const label =
    submitLabel ??
    (mode === "edit" ? "Save Changes" : "Build Your Companion");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Companion Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter the companion name"
                    {...field}
                    className="input"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subject</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="input capitalize">
                      <SelectValue placeholder="Select the subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem
                          value={subject}
                          key={subject}
                          className="capitalize"
                        >
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="topic"
            render={({ field }) => (
              <FormItem className="lg:col-span-2">
                <FormLabel>What should the companion help with?</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Ex. Derivates & Integrals"
                    {...field}
                    className="input"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="session_locale"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("sessionLocale")}</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SESSION_LOCALE_CODES.map((code) => (
                        <SelectItem value={code} key={code}>
                          {languageDisplayName(code, uiLocale)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <p className="text-xs text-muted-foreground">{t("sessionLocaleHelp")}</p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="voice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Voice</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="input">
                      <SelectValue placeholder="Select the voice" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="style"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Style</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="input">
                      <SelectValue placeholder="Select the style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated session duration in minutes</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="15"
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    className="input"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="system_prompt"
            render={({ field }) => (
              <FormItem className="lg:col-span-2">
                <FormLabel>Custom teaching instructions (optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g. Use simple analogies, quiz me every few minutes, focus on exam-style questions..."
                    {...field}
                    value={field.value ?? ""}
                    className="input min-h-28"
                    maxLength={SYSTEM_PROMPT_MAX_LENGTH}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Appended to the default tutor prompt during voice sessions.{" "}
                  {customPrompt.length}/{SYSTEM_PROMPT_MAX_LENGTH}
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_public"
            render={({ field }) => (
              <FormItem className="lg:col-span-2 flex flex-row items-center gap-3 rounded-xl border border-border px-4 py-4">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="size-4 accent-primary"
                  />
                </FormControl>
                <div className="space-y-1">
                  <FormLabel className="!mt-0">Make this companion public</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Public companions appear in the library for everyone to discover.
                  </p>
                  {!isPublic && (
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      Private companions are only visible to you under My Companions.
                      Turn this on to share your tutor in the public library.
                    </p>
                  )}
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" className="btn-primary h-11 text-base lg:max-w-xs">
            {label}
          </Button>
          {mode === "edit" && companionId && (
            <Button
              type="button"
              variant="outline"
              className="h-11 text-base lg:max-w-xs"
              onClick={() => router.push(`/companions/${companionId}`)}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
};

export default CompanionForm;
