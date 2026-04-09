import { useState } from 'react'
import { useTranscript, useProcessTranscript } from '@/hooks/useTranscript'
import { useOpenIssues } from '@/hooks/useIssues'
import { TranscriptResults } from './TranscriptResults'
import { supabase } from '@/lib/supabase'
import { FileText, Loader2, Download } from 'lucide-react'
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
  const [fetchingGranola, setFetchingGranola] = useState(false)
  const [granolaMeetings, setGranolaMeetings] = useState<Array<{ id: string; title: string; date: string }> | null>(null)

  const handleFetchGranolaList = async () => {
    setFetchingGranola(true)
    try {
      const { data, error } = await supabase.functions.invoke('fetch-granola', {
        body: { action: 'list' },
      })
      if (error) throw error
      setGranolaMeetings(data.meetings ?? data ?? [])
    } catch {
      toast.error('Could not fetch from Granola. Check if GRANOLA_API_KEY is set.')
      // Fall back to manual paste
      setShowInput(true)
    } finally {
      setFetchingGranola(false)
    }
  }

  const handleSelectGranolaMeeting = async (granolaMeetingId: string) => {
    setFetchingGranola(true)
    try {
      const { data, error } = await supabase.functions.invoke('fetch-granola', {
        body: { action: 'transcript', meeting_id: granolaMeetingId },
      })
      if (error) throw error
      const transcriptText = data.transcript ?? data.text ?? JSON.stringify(data)
      setText(transcriptText)
      setGranolaMeetings(null)
      setShowInput(true)
      toast.success('Transcript fetched from Granola')
    } catch {
      toast.error('Could not fetch transcript. Try pasting manually.')
      setShowInput(true)
    } finally {
      setFetchingGranola(false)
    }
  }

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

  // Granola meeting picker
  if (granolaMeetings) {
    return (
      <div className="space-y-2">
        <p className="text-[12px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
          Select a Granola meeting
        </p>
        {granolaMeetings.length === 0 ? (
          <p className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
            No recent meetings found. <button onClick={() => { setGranolaMeetings(null); setShowInput(true) }} className="underline" style={{ color: 'var(--accent)' }}>Paste manually</button>
          </p>
        ) : (
          <div className="space-y-1">
            {granolaMeetings.map((gm) => (
              <button
                key={gm.id}
                onClick={() => handleSelectGranolaMeeting(gm.id)}
                className="flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left text-[13px] transition-colors duration-150 hover:bg-[var(--bg-tertiary)]"
                style={{ borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
              >
                <FileText size={14} style={{ color: 'var(--text-tertiary)' }} />
                <span className="flex-1">{gm.title || 'Untitled meeting'}</span>
                {gm.date && <span className="text-[11px]" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{gm.date}</span>}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => { setGranolaMeetings(null); setShowInput(true) }}
          className="text-[12px]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Or paste transcript manually
        </button>
      </div>
    )
  }

  // Not yet synced
  if (!showInput) {
    return (
      <div className="flex gap-2">
        <button
          onClick={handleFetchGranolaList}
          disabled={fetchingGranola}
          className="flex items-center gap-2 rounded-md border px-3 py-2 text-[13px] font-medium transition-colors duration-150 hover:bg-[var(--bg-tertiary)]"
          style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
        >
          {fetchingGranola ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          Fetch from Granola
        </button>
        <button
          onClick={() => setShowInput(true)}
          className="flex items-center gap-2 rounded-md border px-3 py-2 text-[13px] font-medium transition-colors duration-150 hover:bg-[var(--bg-tertiary)]"
          style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
        >
          <FileText size={14} />
          Paste transcript
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-[12px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
        {text ? 'Transcript from Granola (edit if needed)' : 'Paste the meeting transcript from Granola'}
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
