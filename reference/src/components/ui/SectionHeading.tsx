interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
}

export function SectionHeading({ title, subtitle, centered = false }: SectionHeadingProps) {
  return (
    <div className={centered ? "text-center" : ""}>
      {centered && (
        <div className="mb-4 flex justify-center">
          <div className="h-1 w-12 rounded-full bg-brand-primary" />
        </div>
      )}
      <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h2>
      {subtitle && <p className={`mt-2 text-base text-foreground-secondary ${centered ? "mx-auto max-w-2xl" : "max-w-2xl"}`}>{subtitle}</p>}
    </div>
  );
}
