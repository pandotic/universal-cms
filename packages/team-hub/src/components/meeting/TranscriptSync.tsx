import { useState } from 'react'
import { useTranscript, useProcessTranscript } from '@/hooks/useTranscript'
import { useOpenIssues } from '@/hooks/useIssues'
import { TranscriptResults } from './TranscriptResults'
import { FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface TranscriptSyncProps {
  meetingId: string
  readOnly?: boolean
}

export function TranscriptSync({ meetingId, readOnly }: TranscriptSyncProps) {
  const { data: transcript } = useTranscript(meetingId)
  const { data: openIssues } = useOpenIssues()
  const processTranscript = useProcessTranscript()
  const [showInput, setShowInput] = useState(false)
  const [text, setText] = useState('')

  const handleProcess = () => {
    if (!text.trim()) return
    processTranscript.mutate(
      {
        meetingId,
        transcriptText: text.trim(),
        openIssues: (openIssues ?? []).map((i) => ({ id: i.id, title: i.title })),
      },
      {
        onSuccess: () => {
          toast.success('Transcript processed')
          setShowInput(false)
        },
        onError: () => {
          toast.error('Failed to process transcript')
        },
      }
    )
  }

  // Already processed — show results
  if (transcript?.processed_at) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--status-green)' }}>
          <FileText size={14} />
          <span className="font-medium">Transcript synced</span>
        </div>
        {transcript.ai_summary && (
          <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-secondary)' }}>
            <p className="text-[12px] font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
              AI Summary
            </p>
            <p className="text-[13px]" style={{ color: 'var(--text-primary)' }}>
              {transcript.ai_summary}
            </p>
          </div>
        )}
        {!readOnly && (
          <TranscriptResults transcript={transcript} meetingId={meetingId} />
        )}
      </div>
    )
  }

  if (readOnly) return null

  // Not yet synced
  if (!showInput) {
    return (
      <button
        onClick={() => setShowInput(true)}
        className="flex items-center gap-2 rounded-md border px-3 py-2 text-[13px] font-medium transition-colors duration-150 hover:bg-[var(--bg-tertiary)]"
        style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
      >
        <FileText size={14} />
        Sync meeting transcript
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-[12px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
        Paste the meeting transcript from Granola
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your Granola transcript here..."
        rows={6}
        className="w-full resize-none rounded-md border px-3 py-2 text-[13px] outline-none"
        style={{
          borderColor: 'var(--border-default)',
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
        }}
      />
      <div className="flex gap-2">
        <button
          onClick={handleProcess}
          disabled={!text.trim() || processTranscript.isPending}
          className="flex items-center gap-2 rounded-md px-4 py-1.5 text-[13px] font-medium text-white disabled:opacity-50"
          style={{ background: 'var(--accent)' }}
        >
          {processTranscript.isPending && <Loader2 size={14} className="animate-spin" />}
          {processTranscript.isPending ? 'Processing with AI...' : 'Process transcript'}
        </button>
        <button
          onClick={() => { setShowInput(false); setText('') }}
          className="rounded-md px-3 py-1.5 text-[13px] font-medium hover:bg-[var(--bg-tertiary)]"
          style={{ color: 'var(--text-secondary)' }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
