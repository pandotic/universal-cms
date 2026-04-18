import Image from "next/image";
import type { TeamMember } from "@/data/team";

export default function TeamCard({ member }: { member: TeamMember }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-8">
      <div className="flex items-start gap-3 md:gap-4 mb-4 md:mb-6">
        <Image
          src={member.image}
          alt={member.name}
          width={64}
          height={64}
          loading="lazy"
          className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover shrink-0"
        />
        <div>
          <h3 className="text-white text-lg md:text-xl font-semibold">{member.name}</h3>
          <div className="flex flex-wrap gap-1.5 md:gap-2 mt-2">
            {member.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs text-gray-400 border border-white/10 rounded-full px-2.5 md:px-3 py-1"
              >
                {tag}
              </span>
            ))}
          </div>
          {member.linkedin && (
            <a
              href={member.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center mt-2 text-gray-400 hover:text-white transition-colors min-w-[44px] min-h-[44px]"
              aria-label={`${member.name} LinkedIn`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          )}
        </div>
      </div>
      {member.bio.map((paragraph, i) => (
        <p key={i} className="text-gray-300 text-base md:text-lg leading-relaxed mb-4 last:mb-0">
          {paragraph}
        </p>
      ))}
    </div>
  );
}
