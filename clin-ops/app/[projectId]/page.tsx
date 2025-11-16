'use client'

import ContextAwareChat from '@/app/ContextAwareChat'
import { useParams } from 'next/navigation'

export default function ProjectChatPage() {
  const params = useParams()
  const projectId = params?.projectId as string

  return (
    <div className="h-full">
      <ContextAwareChat key={projectId} />
    </div>
  )
}
