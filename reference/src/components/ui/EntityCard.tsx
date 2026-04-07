import Link from "next/link";
import { Entity } from "@/lib/types/entity";
import { Category } from "@/lib/types/category";
import { LayerBadge } from "./LayerBadge";
import { EntityLogo } from "./EntityLogo";

interface EntityCardProps {
  entity: Entity;
  primaryCategory?: Category;
}

export function EntityCard({ entity, primaryCategory }: EntityCardProps) {
  return (
    <div className="group relative flex flex-col rounded-lg border border-border bg-white/80 backdrop-blur-sm p-5 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <div className="mb-3 flex items-start justify-between">
        <EntityLogo name={entity.name} logo={entity.logo} size="md" />
        {primaryCategory && <LayerBadge layer={primaryCategory.layer} />}
      </div>

      <h3 className="mb-1 text-sm font-semibold text-foreground group-hover:text-brand-primary">
        {entity.name}
      </h3>

      <p className="mb-4 line-clamp-2 flex-1 text-sm text-foreground-secondary">{entity.description}</p>

      <div className="flex flex-wrap gap-1">
        {entity.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded bg-surface-tertiary px-1.5 py-0.5 text-xs text-foreground-secondary">
            {tag}
          </span>
        ))}
      </div>

      <Link
        href={`/directory/${entity.slug}`}
        className="absolute inset-0 rounded-lg"
        aria-label={`View ${entity.name}`}
      />
    </div>
  );
}
