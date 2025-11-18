'use client'

import ContextAwareChat from '@/app/ContextAwareChat'
import { useParams } from 'next/navigation'
import LogoutButton from '@/app/components/LogoutButton'

export default function ProjectChatPage() {
  const params = useParams()
  const projectId = params?.projectId as string

  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="font-semibold">ClinOps</div>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1">
        <div className="h-full">
          <ContextAwareChat key={projectId} />
        </div>
      </main>
    </div>
  )
}
