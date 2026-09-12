import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
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
    <Pagination aria-label="Repository pages" className="mt-8 border-t border-border/70 pt-4">
      <PaginationContent>
        <PaginationItem>
          {page <= 1 ? (
            <PaginationPrevious text="Back" disabled aria-label="Back" />
          ) : (
            <PaginationPrevious
              text="Back"
              href={repoPageHref(page - 1, query)}
              aria-label="Back"
            />
          )}
        </PaginationItem>

        {pages.map((number) => (
          <PaginationItem key={number}>
            <PaginationLink
              href={repoPageHref(number, query)}
              isActive={number === page}
              aria-label={`Page ${number}`}
            >
              {number}
            </PaginationLink>
          </PaginationItem>
        ))}

        <PaginationItem>
          {page >= totalPages ? (
            <PaginationNext disabled aria-label="Next" />
          ) : (
            <PaginationNext href={repoPageHref(page + 1, query)} aria-label="Next" />
          )}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
