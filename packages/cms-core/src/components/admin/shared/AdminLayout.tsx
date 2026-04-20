import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, AlertCircle } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  isDevMode?: boolean;
  sidebar?: React.ReactNode;
}

export function AdminLayout({
  children,
  title,
  description,
  breadcrumbs = [],
  actions,
  isDevMode = false,
  sidebar,
}: AdminLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--admin-bg,#f9fafb)]">
      {isDevMode && (
        <div className="bg-yellow-500 text-black px-4 py-2 text-sm font-medium text-center">
          <AlertCircle className="inline-block h-4 w-4 mr-2" />
          DEV MODE: Admin panel is accessible without full authentication.
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {breadcrumbs.length > 0 && (
          <nav className="flex mb-4" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center">
                  {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />}
                  {crumb.path ? (
                    <button
                      onClick={() => navigate(crumb.path!)}
                      className="text-sm text-[var(--admin-link,#2563eb)] hover:underline"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span className="text-sm text-gray-500">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>

        {sidebar ? (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-64 flex-shrink-0">{sidebar}</div>
            <div className="flex-1">{children}</div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
