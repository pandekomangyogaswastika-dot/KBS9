/**
 * Phase 18B: Skeleton loaders untuk better loading UX
 */

export function ServiceCardSkeleton() {
  return (
    <div className="kti-card animate-pulse p-6" data-testid="skeleton-service">
      {/* Icon skeleton */}
      <div className="mb-4 h-12 w-12 rounded-lg bg-white/10" />
      
      {/* Title skeleton */}
      <div className="mb-3 h-6 w-3/4 rounded bg-white/10" />
      
      {/* Description skeleton - 3 lines */}
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-white/5" />
        <div className="h-4 w-5/6 rounded bg-white/5" />
        <div className="h-4 w-4/6 rounded bg-white/5" />
      </div>
      
      {/* Tags skeleton */}
      <div className="mt-4 flex gap-2">
        <div className="h-6 w-16 rounded-full bg-white/5" />
        <div className="h-6 w-20 rounded-full bg-white/5" />
      </div>
    </div>
  );
}

export function ServicesGridSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid="skeleton-services-grid">
      {Array.from({ length: count }).map((_, i) => (
        <ServiceCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CaseCardSkeleton() {
  return (
    <div className="kti-card group overflow-hidden animate-pulse" data-testid="skeleton-case">
      {/* Image skeleton */}
      <div className="aspect-video bg-white/10" />
      
      {/* Content */}
      <div className="p-6">
        {/* Category badge skeleton */}
        <div className="mb-3 h-5 w-24 rounded-full bg-white/10" />
        
        {/* Title skeleton */}
        <div className="mb-3 h-7 w-full rounded bg-white/10" />
        <div className="mb-4 h-7 w-3/4 rounded bg-white/10" />
        
        {/* Description skeleton - 2 lines */}
        <div className="space-y-2 mb-4">
          <div className="h-4 w-full rounded bg-white/5" />
          <div className="h-4 w-5/6 rounded bg-white/5" />
        </div>
        
        {/* Stats skeleton */}
        <div className="flex gap-4">
          <div className="h-4 w-20 rounded bg-white/5" />
          <div className="h-4 w-20 rounded bg-white/5" />
        </div>
      </div>
    </div>
  );
}

export function CasesGridSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid="skeleton-cases-grid">
      {Array.from({ length: count }).map((_, i) => (
        <CaseCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function BlogCardSkeleton() {
  return (
    <div className="kti-card overflow-hidden animate-pulse" data-testid="skeleton-blog">
      {/* Featured image skeleton */}
      <div className="aspect-[16/9] bg-white/10" />
      
      {/* Content */}
      <div className="p-6">
        {/* Category + date skeleton */}
        <div className="mb-3 flex items-center gap-3">
          <div className="h-5 w-20 rounded-full bg-white/10" />
          <div className="h-4 w-24 rounded bg-white/5" />
        </div>
        
        {/* Title skeleton */}
        <div className="mb-3 h-6 w-full rounded bg-white/10" />
        <div className="mb-4 h-6 w-4/5 rounded bg-white/10" />
        
        {/* Excerpt skeleton - 3 lines */}
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-white/5" />
          <div className="h-4 w-full rounded bg-white/5" />
          <div className="h-4 w-3/4 rounded bg-white/5" />
        </div>
      </div>
    </div>
  );
}

export function BlogGridSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid="skeleton-blog-grid">
      {Array.from({ length: count }).map((_, i) => (
        <BlogCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TeamCardSkeleton() {
  return (
    <div className="kti-card text-center animate-pulse" data-testid="skeleton-team">
      {/* Avatar skeleton */}
      <div className="mx-auto mb-4 h-24 w-24 rounded-full bg-white/10" />
      
      {/* Name skeleton */}
      <div className="mx-auto mb-2 h-5 w-32 rounded bg-white/10" />
      
      {/* Position skeleton */}
      <div className="mx-auto mb-3 h-4 w-24 rounded bg-white/5" />
      
      {/* Bio skeleton - 2 lines */}
      <div className="space-y-2">
        <div className="mx-auto h-3 w-full rounded bg-white/5" />
        <div className="mx-auto h-3 w-4/5 rounded bg-white/5" />
      </div>
    </div>
  );
}

export function TeamGridSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid="skeleton-team-grid">
      {Array.from({ length: count }).map((_, i) => (
        <TeamCardSkeleton key={i} />
      ))}
    </div>
  );
}
