"use client";

import { useState } from 'react'
import { MoreHorizontal, ArrowRight, X, MessageSquare } from 'lucide-react'
import { PriorityBadge } from '@/components/team-hub/ui/PriorityBadge'
import { UserAvatar } from '@/components/team-hub/ui/UserAvatar'
import { ResolveDialog } from './ResolveDialog'
import { IssueDiscussionPanel } from './IssueDiscussionPanel'
import { useDeferIssue, useDropIssue } from '@/hooks/team-hub/useIssues'
import { timeAgo } from '@/lib/team-hub/utils'
import { toast } from 'sonner'
import type { OpenIssue } from '@/lib/team-hub/types'

interface IssueCardProps {
  issue: OpenIssue
  meetingId?: string
}

export function IssueCard({ issue, meetingId }: IssueCardProps) {
  const [showResolve, setShowResolve] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [showDiscussion, setShowDiscussion] = useState(false)
  const deferIssue = useDeferIssue()
  const dropIssue = useDropIssue()

  const handleDefer = () => {
    deferIssue.mutate(issue.id, {
      onSuccess: () => toast.success('Issue deferred'),
    })
  }

  const handleDrop = () => {
    if (confirm('Drop this issue? It won\'t appear in future meetings.')) {
      dropIssue.mutate(issue.id, {
        onSuccess: () => toast.success('Issue dropped'),
      })
    }
  }

  return (
    <>
      <div
        className="group rounded-lg border p-3 transition-colors duration-150 hover:border-[var(--border-hover)]"
        style={{ borderColor: 'var(--border-default)' }}
      >
        <div className="flex items-start gap-3">
          <PriorityBadge priority={issue.priority} />
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>
              {issue.title}
            </h3>
            <div className="mt-1 flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
              {issue.submitter_name && issue.submitter_short && issue.submitter_color && (
                <span className="flex items-center gap-1">
                  <UserAvatar name={issue.submitter_short} color={issue.submitter_color} size={16} />
                  {issue.submitter_name}
                </span>
              )}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                {timeAgo(issue.created_at)}
              </span>
              {issue.source !== 'manual' && (
                <span
                  className="rounded px-1 py-0.5 text-[10px] uppercase"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}
                >
                  {issue.source}
                </span>
              )}
              {issue.status === 'deferred' && (
                <span
                  className="rounded px-1 py-0.5 text-[10px] uppercase"
                  style={{ background: 'var(--priority-discuss-bg)', color: 'var(--priority-discuss)' }}
                >
                  deferred
                </span>
              )}
            </div>
          </div>
          <div className="relative flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            {meetingId && (
              <button
                onClick={() => setShowDiscussion(!showDiscussion)}
                className="rounded-md border p-1 transition-colors duration-150 hover:bg-[var(--bg-tertiary)]"
                style={{ borderColor: 'var(--border-default)', color: showDiscussion ? 'var(--accent)' : 'var(--text-tertiary)' }}
              >
                <MessageSquare size={14} />
              </button>
            )}
            <button
              onClick={() => setShowResolve(true)}
              className="rounded-md border px-2 py-1 text-[12px] font-medium transition-colors duration-150 hover:bg-[var(--bg-tertiary)]"
              style={{ borderColor: 'var(--border-default)', color: 'var(--status-green)' }}
            >
              Resolve
            </button>
            <button
              onClick={() => setShowActions(!showActions)}
              className="rounded-md p-1 transition-colors duration-150 hover:bg-[var(--bg-tertiary)]"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <MoreHorizontal size={14} />
            </button>
            {showActions && (
              <div
                className="absolute right-0 top-full z-10 mt-1 rounded-lg border p-1 shadow-lg"
                style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-default)' }}
              >
                <button
                  onClick={() => { handleDefer(); setShowActions(false) }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-[13px] hover:bg-[var(--bg-tertiary)]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <ArrowRight size={14} />
                  Defer
                </button>
                <button
                  onClick={() => { handleDrop(); setShowActions(false) }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-[13px] hover:bg-[var(--bg-tertiary)]"
                  style={{ color: 'var(--priority-urgent)' }}
                >
                  <X size={14} />
                  Drop
                </button>
              </div>
            )}
          </div>
        </div>
        {showDiscussion && (
          <IssueDiscussionPanel issueId={issue.id} meetingId={meetingId} />
        )}
      </div>

      {showResolve && (
        <ResolveDialog
          issueId={issue.id}
          meetingId={meetingId}
          onClose={() => setShowResolve(false)}
        />
      )}
    </>
  )
}
