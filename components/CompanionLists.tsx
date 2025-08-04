'use client';

import {
    Table, 
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableCaption
} from "@/components/ui/table"
import { cn, getSubjectColor } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

// Function để format date một cách nhất quán
const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}/${day}/${year}`;
};

interface CompanionsListProps {
     title: string;
     companions?: (Companion | SessionCompanion)[];
     classNames?: string;
}

const CompanionLists = ({ title, companions, classNames }: CompanionsListProps) => {
  return (
    <article className={cn('companion-list', classNames)}>
        <h2 className="font-bold text-3xl">{title}</h2>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="text-lg w-1/2">Lessons</TableHead>
                    <TableHead className="text-lg">Subject</TableHead>
                    <TableHead className="text-lg">Date</TableHead>
                    <TableHead className="text-lg text-right">Duration</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {companions?.map(({ id, subject, name, topic, duration, sessionDate, sessionId }, index) => (
                    <TableRow key={sessionId || `${id}-${index}`}>
                        <TableCell>
                            <Link href={`/companions/${id}`}>
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
                                        transition={{ duration: 0.3, delay: id * 0.1 }}
                                        className="size-[72px] flex items-center justify-center rounded-lg max-md:hidden" 
                                        style={{ backgroundColor: getSubjectColor(subject) }}
                                    >
                                        <Image src={`/icons/${subject}.svg`} alt={subject} width={35} height={35} />
                                    </motion.div>
                                    <div className="flex flex-col gap-2">
                                        <p className="font-bold text-2xl">{name}</p>
                                        <p className="text-lg">{topic}</p>
                                    </div>
                                </motion.div>
                            </Link>
                        </TableCell>

                        <TableCell>
                            <div className="subject-badge w-fit max-md:hidden">
                                {subject}
                            </div>
                            <div className="flex items-center justify-center rounded-lg w-fit p-2 md:hidden" style={{ backgroundColor: getSubjectColor(subject) }}>
                                <Image src={`/icons/${subject}.svg`} alt={subject} width={18} height={18} />
                            </div>
                        </TableCell>

                        <TableCell>
                            {sessionDate && (
                                <div className="text-sm text-muted-foreground" suppressHydrationWarning>
                                    {formatDate(sessionDate)}
                                </div>
                            )}
                        </TableCell>

                        <TableCell>
                            <div className="flex items-center gap-2 w-full justify-end">
                                <p className="text-2xl">
                                    {duration} {' '}
                                    <span className="max-md:hidden">
                                        mins
                                    </span>
                                </p>
                                <Image src="/icons/clock.svg" alt="minutes" width={14} height={14} className="md:hidden" />
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </article>
  )
}

export default CompanionLists