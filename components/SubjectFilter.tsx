"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { subjects } from "@/constants";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { buildCompanionsUrl } from "@/lib/library-url";

const SubjectFilter = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subjectFromUrl = searchParams.get("subject") || "all";

  const [selectedSubject, setSelectedSubject] = useState(subjectFromUrl);

  useEffect(() => {
    setSelectedSubject(subjectFromUrl);
  }, [subjectFromUrl]);

  const handleChange = (value: string) => {
    setSelectedSubject(value);

    const newUrl =
      value === "all" || !value
        ? buildCompanionsUrl(searchParams, { subject: null })
        : buildCompanionsUrl(searchParams, { subject: value });

    router.push(newUrl, { scroll: false });
  };

  return (
    <Select onValueChange={handleChange} value={selectedSubject}>
      <SelectTrigger className="input h-10 w-full capitalize">
        <SelectValue placeholder="Select Subject" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Subjects</SelectItem>
        {subjects.map((subject) => (
          <SelectItem value={subject} key={subject}>
            {subject}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default SubjectFilter;
