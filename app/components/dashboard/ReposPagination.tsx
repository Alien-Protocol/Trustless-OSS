import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '@/app/components/ui/Button';
import { repoPageHref } from '@/lib/repo-filters';

export const REPO_PAGE_SIZE = 15;

export default function ReposPagination({
  page,
  totalPages,
  query,
}: {
  page: number;
  totalPages: number;
  query?: { q?: string; sort?: string };
}) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav
      aria-label="Repository pages"
      className="mt-8 flex items-center justify-between gap-2 border-t border-border/70 pt-4"
    >
      {page <= 1 ? (
        <Button
          variant="outline"
          size="sm"
          disabled
          aria-label="Back"
          className="shrink-0 px-2.5 sm:px-3.5"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Back</span>
        </Button>
      ) : (
        <Button
          href={repoPageHref(page - 1, query)}
          variant="outline"
          size="sm"
          aria-label="Back"
          className="shrink-0 px-2.5 sm:px-3.5"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Back</span>
        </Button>
      )}
      <div className="flex min-w-0 flex-wrap items-center justify-center gap-1">
        {pages.map((number) => (
          <Button
            key={number}
            href={repoPageHref(number, query)}
            variant={number === page ? 'solid' : 'outline'}
            size="sm"
            aria-current={number === page ? 'page' : undefined}
            aria-label={`Page ${number}`}
            className="min-w-9 px-3"
          >
            {number}
          </Button>
        ))}
      </div>
      {page >= totalPages ? (
        <Button
          variant="outline"
          size="sm"
          disabled
          aria-label="Next"
          className="shrink-0 px-2.5 sm:px-3.5"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      ) : (
        <Button
          href={repoPageHref(page + 1, query)}
          variant="outline"
          size="sm"
          aria-label="Next"
          className="shrink-0 px-2.5 sm:px-3.5"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      )}
    </nav>
  );
}
