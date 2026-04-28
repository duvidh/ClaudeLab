'use client'

import { useState } from 'react'
import { Send, MessageSquare } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import type { LeadNote } from '@/types'

interface NotesListProps {
  notes: LeadNote[]
  onAddNote: (content: string) => Promise<void>
}

export function NotesList({ notes, onAddNote }: NotesListProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)
    try {
      await onAddNote(content.trim())
      setContent('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Add note form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="הוסף הערה..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Button type="submit" size="sm" loading={loading} disabled={!content.trim()}>
          <Send size={14} />
        </Button>
      </form>

      {/* Notes list */}
      {notes.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-gray-500">
          <MessageSquare size={24} className="mb-2" />
          <p className="text-sm">אין הערות עדיין</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <div key={note.id} className="bg-gray-750 border border-gray-700 rounded-lg p-3">
              <p className="text-sm text-gray-200 leading-relaxed">{note.content}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-5 h-5 rounded-full bg-blue-600/30 flex items-center justify-center text-xs text-blue-300">
                  {note.author.charAt(0)}
                </div>
                <span className="text-xs text-gray-400">{note.author}</span>
                <span className="text-xs text-gray-600">·</span>
                <span className="text-xs text-gray-500">{timeAgo(note.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
