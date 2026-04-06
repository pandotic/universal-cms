import Image from "next/image";

interface EntityLogoProps {
  name: string;
  logo?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = {
  sm: { px: 24, className: "h-6 w-6" },
  md: { px: 40, className: "h-10 w-10" },
  lg: { px: 64, className: "h-16 w-16" },
};

function getInitials(name: string): string {
  return name
    .split(/[\s(]+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function EntityLogo({ name, logo, size = "md", className = "" }: EntityLogoProps) {
  const { px, className: sizeClass } = SIZE_MAP[size];
  const initials = getInitials(name);

  if (logo) {
    return (
      <div
        className={`relative flex-shrink-0 overflow-hidden rounded-lg ${sizeClass} ${className}`}
      >
        <Image
          src={logo}
          alt={`${name} logo`}
          width={px}
          height={px}
          className="h-full w-full object-contain"
        />
      </div>
    );
  }

  // Fallback: text initials
  const textSize = size === "lg" ? "text-lg" : size === "md" ? "text-sm" : "text-xs";
  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center rounded-lg bg-surface-tertiary font-bold text-foreground-secondary ${sizeClass} ${textSize} ${className}`}
    >
      {initials}
    </div>
  );
}
