import { Skeleton } from "@/components/ui/skeleton";

const CARDS = ["c1", "c2", "c3", "c4"];

export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-6">
      <span className="sr-only">Carregando...</span>
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((id) => (
          <Skeleton key={id} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}
