// Skeleton for ProductCard — pure CSS, no dependency
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs flex flex-col overflow-hidden animate-pulse">
      {/* Image placeholder */}
      <div className="aspect-square w-full bg-stone-200" />
      {/* Content */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col gap-3">
        <div className="h-4 bg-stone-200 rounded-lg w-4/5" />
        <div className="h-3 bg-stone-100 rounded-lg w-3/5" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3 bg-stone-100 rounded-lg w-full" />
          <div className="h-3 bg-stone-100 rounded-lg w-2/3" />
        </div>
        <div className="pt-2 border-t border-stone-100 space-y-2">
          <div className="h-5 bg-stone-200 rounded-lg w-1/2" />
          <div className="h-10 bg-stone-200 rounded-xl w-full" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
