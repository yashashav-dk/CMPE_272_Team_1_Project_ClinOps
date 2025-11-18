'use client'

import { useState } from 'react'

type FeedbackType = 'up' | 'down'

export default function Feedback() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleClick = async (type: FeedbackType) => {
    if (submitted || loading) return

    setLoading(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })

      if (res.ok) {
        setSubmitted(true)
      } else {
        console.error('Feedback failed')
      }
    } catch (err) {
      console.error('Feedback error', err)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-4">
        <p className="text-green-600 font-semibold">Thanks for your feedback! ✅</p>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center gap-4 py-4">
      <button
        onClick={() => handleClick('up')}
        className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded font-semibold disabled:opacity-50"
        disabled={loading}
      >
        👍
      </button>
      <button
        onClick={() => handleClick('down')}
        className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded font-semibold disabled:opacity-50"
        disabled={loading}
      >
        👎
      </button>
    </div>
  )
}
