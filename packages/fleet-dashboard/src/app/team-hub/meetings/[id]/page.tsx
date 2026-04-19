"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMeeting } from "@/hooks/team-hub/useMeetings";
import { MeetingView } from "@/components/team-hub/meeting/MeetingView";
import { ArrowLeft } from "lucide-react";

export default function MeetingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { data: meeting, isLoading, error } = useMeeting(id!);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-20 animate-pulse rounded-lg" style={{ background: "var(--bg-tertiary)" }} />
        <div className="h-40 animate-pulse rounded-lg" style={{ background: "var(--bg-tertiary)" }} />
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="rounded-lg border p-6 text-center" style={{ borderColor: "var(--border-default)" }}>
        <p className="text-[14px]" style={{ color: "var(--priority-urgent)" }}>
          Meeting not found
        </p>
        <Link href="/team-hub/meetings" className="mt-2 inline-block text-[13px]" style={{ color: "var(--accent)" }}>
          &larr; Back to past meetings
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/team-hub/meetings"
        className="mb-4 inline-flex items-center gap-1 text-[13px] transition-colors duration-150 hover:opacity-80"
        style={{ color: "var(--text-tertiary)" }}
      >
        <ArrowLeft size={14} />
        Past meetings
      </Link>
      <MeetingView meeting={meeting} readOnly />
    </div>
  );
}
