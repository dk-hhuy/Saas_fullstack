'use client';

import React, { useEffect, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { subjects } from '@/constants'
import { useSearchParams, useRouter } from 'next/navigation';
import { formUrlQuery, removeKeysFromUrlQuery } from '@jsmastery/utils';


const SubjectFilter = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('subject') || '';
  
  const [selectedSubject, setSelectedSubject] = useState(query)
  
  useEffect(() => {
    let newUrl = "";
    if (selectedSubject === 'all') {
      newUrl = removeKeysFromUrlQuery({
        params: searchParams.toString(),
        keysToRemove: ['subject'],
      });
      
    } else {
      newUrl = formUrlQuery({
        params: searchParams.toString(),
        key: 'subject',
        value: selectedSubject,
      });


      router.push(newUrl, { scroll: false });
    }
  }, [selectedSubject]);

  return (
           <Select onValueChange={setSelectedSubject} value={selectedSubject}>
             <SelectTrigger className="input capitalize">
              <SelectValue placeholder="Select Subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map((subject) => (
                <SelectItem value={subject} key={subject}>{subject}</SelectItem>
              ))}

            </SelectContent>
          </Select>
  


  )
}

export default SubjectFilter