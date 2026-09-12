import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { NavbarSkeleton } from '../components/layout/PageSkeletons';

export default function DocsLoading() {
  return (
    <div className="relative flex min-h-screen flex-col" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading guide</span>
      <NavbarSkeleton />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6 md:py-16">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-3 h-12 w-64 sm:h-16" />
        <Skeleton className="mt-4 h-16 max-w-2xl" />
        <div className="mt-12 grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="rounded-2xl py-0">
              <CardContent className="flex items-center gap-3 py-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 flex-1" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-16 grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="rounded-2xl">
              <CardHeader className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-12 w-full" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
