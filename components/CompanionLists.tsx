"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTheme } from "@/components/ThemeProvider";
import { cn, getSubjectColor } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import DeleteCompanionButton from "./DeleteCompanionButton";
import EditCompanionButton from "./EditCompanionButton";
import SubjectBadge from "./SubjectBadge";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}/${day}/${year}`;
};

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} mins`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

interface CompanionsListProps {
  title: string;
  companions?: SessionCompanion[];
  classNames?: string;
  allowDelete?: boolean;
  allowEdit?: boolean;
  linkToSession?: boolean;
}

const CompanionLists = ({
  title,
  companions,
  classNames,
  allowDelete = false,
  allowEdit = false,
  linkToSession = false,
}: CompanionsListProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const subjectSwatchColor = (subject: string) =>
    getSubjectColor(subject, isDark ? "dark" : "light");

  return (
    <article className={cn("companion-list", classNames)}>
      <h2 className="text-2xl font-bold">{title}</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-lg w-1/2">Lessons</TableHead>
            <TableHead className="text-lg">Subject</TableHead>
            <TableHead className="text-lg">Date</TableHead>
            <TableHead className="text-lg text-right">Duration</TableHead>
            {(allowDelete || allowEdit) && (
              <TableHead className="text-lg text-right">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {companions?.map(
            (
              {
                id,
                subject,
                name,
                topic,
                duration,
                sessionDate,
                sessionId,
                actualDuration,
                companionUnavailable,
              },
              index
            ) => {
              const href =
                linkToSession && sessionId
                  ? `/sessions/${sessionId}`
                  : `/companions/${id}`;
              const displayMinutes =
                actualDuration != null
                  ? Math.max(1, Math.round(actualDuration / 60))
                  : duration;

              return (
                <TableRow key={sessionId || `${id}-${index}`}>
                  <TableCell>
                    <Link href={href}>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ x: -10 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center gap-2"
                      >
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8, rotate: 0, x: -60 }}
                          animate={{ opacity: 1, scale: 1, rotate: 360, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="size-[72px] flex items-center justify-center rounded-lg max-md:hidden"
                          style={{ backgroundColor: subjectSwatchColor(subject) }}
                        >
                          <Image
                            src={`/icons/${subject}.svg`}
                            alt={subject}
                            width={35}
                            height={35}
                          />
                        </motion.div>
                        <div className="flex flex-col gap-2">
                          <p className="font-bold text-2xl">{name}</p>
                          <p className="text-lg">{topic}</p>
                          {companionUnavailable && (
                            <span className="text-xs text-muted-foreground">
                              Transcript still available
                            </span>
                          )}
                        </div>
                      </motion.div>
                    </Link>
                  </TableCell>

                  <TableCell>
                    <SubjectBadge subject={subject} className="w-fit max-md:hidden" />
                    <div
                      className="flex items-center justify-center rounded-lg w-fit p-2 md:hidden"
                      style={{ backgroundColor: subjectSwatchColor(subject) }}
                    >
                      <Image
                        src={`/icons/${subject}.svg`}
                        alt={subject}
                        width={18}
                        height={18}
                      />
                    </div>
                  </TableCell>

                  <TableCell>
                    {sessionDate && (
                      <div
                        className="text-sm text-muted-foreground"
                        suppressHydrationWarning
                      >
                        {formatDate(sessionDate)}
                      </div>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2 w-full justify-end">
                      <p className="text-2xl">
                        {formatDuration(displayMinutes)}
                      </p>
                      <Image
                        src="/icons/clock.svg"
                        alt="minutes"
                        width={14}
                        height={14}
                        className="md:hidden"
                      />
                    </div>
                  </TableCell>

                  {(allowDelete || allowEdit) && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {allowEdit && (
                          <EditCompanionButton companionId={id} variant="icon" />
                        )}
                        {allowDelete && (
                          <DeleteCompanionButton
                            companionId={id}
                            companionName={name}
                          />
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            }
          )}
        </TableBody>
      </Table>
    </article>
  );
};

export default CompanionLists;
