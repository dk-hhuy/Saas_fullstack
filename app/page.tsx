import CompanionCard from '@/components/CompanionCard'
import CompanionLists from '@/components/CompanionLists'
import CTA from '@/components/CTA'
import { recentSessions } from '@/constants'
import { getAllCompanions, getRecentSession } from '@/lib/actions/companion.actions'
import { getSubjectColor } from '@/lib/utils'
import React from 'react'

const Page = async () => {

  const companions = await getAllCompanions({ limit: 3 });
  const recentSessions = await getRecentSession(10);


  return (
    <main>
      <h1 className="text-2xl underline">
        Popular Companions
      </h1>
      
      <section className="home-section">

        {companions.map((companion) => (
          <CompanionCard key={companion.id} {...companion} color={getSubjectColor(companion.subject)} />
        ))}
        
      </section>

      <section className="home-section">
        <CompanionLists 
          title="Recently completed sessions"
          companions={recentSessions}
          classNames="w-2/3 max-lg:w-full"
        />
        <CTA />
      </section>

    </main>
  )
}

export default Page