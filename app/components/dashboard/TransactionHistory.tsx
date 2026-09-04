'use client';

import { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Ban,
  ChevronLeft,
  ChevronRight,
  Layers,
  Lock,
  Tag,
  Unlock,
  UserMinus,
  UserPlus,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Button from '@/app/components/ui/Button';
import GithubUserLink from '@/app/components/dashboard/GithubUserLink';
import {
  ACTIVITY_FILTERS,
  DEMO_ACTIVITY,
  KIND_STYLES,
  filterActivity,
  formatUsdc,
  formatWhen,
  githubIssueUrl,
  shortenHash,
  txExplorerUrl,
  type ActivityFilter,
  type ActivityRow,
} from '@/app/components/dashboard/MaintainerActivity';

export const TX_PAGE_SIZE = 20;

const FILTER_ICONS = {
  all: Layers,
  rewarded: Tag,
  locked: Lock,
  released: Unlock,
  assigned: UserPlus,
  unassigned: UserMinus,
  rejected: Ban,
} as const;

export function paginateItems<T>(items: T[], page: number, pageSize = TX_PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  const start = (current - 1) * pageSize;
  return {
    page: current,
    totalPages,
    items: items.slice(start, start + pageSize),
  };
}

function IssueCell({ row }: { row: ActivityRow }) {
  if (!row.issueNumber) {
    return (
      <div className="min-w-0">
        <p className="font-semibold">Pool deposit</p>
        <p className="truncate text-sm text-muted-foreground">{row.repo}</p>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <a
        href={githubIssueUrl(row.repo, row.issueNumber)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex max-w-full items-start gap-1 text-[0.95rem] font-semibold text-foreground hover:text-primary"
      >
        <span className="line-clamp-2">
          #{row.issueNumber} {row.issueTitle}
        </span>
        <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      </a>
      <p className="truncate text-sm text-muted-foreground">{row.repo}</p>
    </div>
  );
}

function TxCell({ hash }: { hash: string }) {
  return (
    <a
      href={txExplorerUrl(hash)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-mono text-sm font-semibold text-primary hover:underline"
    >
      {shortenHash(hash)}
      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
    </a>
  );
}

function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav
      aria-label="Transaction pages"
      className="flex flex-col gap-3 border-t border-border/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
    >
      <Button variant="outline" size="sm" onClick={() => onPage(page - 1)} disabled={page <= 1}>
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Back
      </Button>
      <div className="flex flex-wrap items-center justify-center gap-1">
        {pages.map((number) => (
          <Button
            key={number}
            variant={number === page ? 'solid' : 'ghost'}
            size="sm"
            onClick={() => onPage(number)}
            aria-current={number === page ? 'page' : undefined}
            aria-label={`Page ${number}`}
            className="min-w-9 px-3"
          >
            {number}
          </Button>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
      >
        Next
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </nav>
  );
}

export default function TransactionHistory({ rows = DEMO_ACTIVITY }: { rows?: ActivityRow[] }) {
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => filterActivity(rows, filter), [rows, filter]);
  const paged = useMemo(() => paginateItems(filtered, page), [filtered, page]);

  return (
    <Tabs
      value={filter}
      onValueChange={(value) => {
        setFilter(value as ActivityFilter);
        setPage(1);
      }}
      className="gap-0"
    >
      <Card className="overflow-visible rounded-3xl py-0">
        <CardHeader className="border-b border-border/70 pt-6">
          <CardTitle className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">
            Activity
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Newest first, with GitHub issues and Stellar transaction links.
          </CardDescription>
          <CardAction className="max-sm:col-span-full max-sm:mt-2 max-sm:justify-self-start">
            <TabsList
              aria-label="Filter activity"
              className="h-auto w-fit max-w-full flex-wrap gap-0.5 rounded-xl p-1 group-data-horizontal/tabs:h-auto"
            >
              {ACTIVITY_FILTERS.map((item) => {
                const Icon = FILTER_ICONS[item.value];
                return (
                  <TabsTrigger
                    key={item.value}
                    value={item.value}
                    onClick={() => {
                      setFilter(item.value);
                      setPage(1);
                    }}
                    className="h-8 shrink-0 gap-1 px-2.5 py-1 text-xs font-semibold sm:text-sm"
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                    {item.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </CardAction>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {paged.items.length === 0 ? (
            <p className="px-6 py-16 text-center text-base font-semibold text-muted-foreground">
              No activity in this filter.
            </p>
          ) : (
            <>
              <div className="divide-y md:hidden">
                {paged.items.map((row) => {
                  const meta = KIND_STYLES[row.kind];
                  return (
                    <article key={row.id} className="space-y-3 px-4 py-4 text-[0.95rem]">
                      <div className="flex items-start justify-between gap-3">
                        <Badge
                          className={`h-auto rounded-full px-2.5 py-1 text-sm ${meta.className}`}
                        >
                          {meta.label}
                        </Badge>
                        <time className="shrink-0 text-sm text-muted-foreground">
                          {formatWhen(row.at)}
                        </time>
                      </div>
                      <IssueCell row={row} />
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-mono text-base font-semibold">
                          {row.amountUsdc == null ? '—' : formatUsdc(row.amountUsdc)}
                        </p>
                        {row.contributor ? (
                          <GithubUserLink name={row.contributor} compact className="text-base" />
                        ) : (
                          <span className="text-base text-muted-foreground">—</span>
                        )}
                      </div>
                      {row.txHash ? (
                        <TxCell hash={row.txHash} />
                      ) : (
                        <p className="text-sm text-muted-foreground">GitHub</p>
                      )}
                    </article>
                  );
                })}
              </div>

              <Table
                className="hidden table-fixed text-base md:table"
                containerClassName="hidden overflow-x-hidden md:block"
              >
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-12 w-[18%] px-4 whitespace-normal text-sm font-semibold tracking-wide text-muted-foreground">
                      When
                    </TableHead>
                    <TableHead className="h-12 w-[34%] px-4 whitespace-normal text-sm font-semibold tracking-wide text-muted-foreground">
                      Issue
                    </TableHead>
                    <TableHead className="h-12 w-[12%] px-4 whitespace-normal text-sm font-semibold tracking-wide text-muted-foreground">
                      Event
                    </TableHead>
                    <TableHead className="h-12 w-[14%] px-4 whitespace-normal text-sm font-semibold tracking-wide text-muted-foreground">
                      Amount
                    </TableHead>
                    <TableHead className="h-12 w-[12%] px-4 whitespace-normal text-sm font-semibold tracking-wide text-muted-foreground">
                      Contributor
                    </TableHead>
                    <TableHead className="h-12 w-[10%] px-4 whitespace-normal text-sm font-semibold tracking-wide text-muted-foreground">
                      Tx
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.items.map((row) => {
                    const meta = KIND_STYLES[row.kind];
                    return (
                      <TableRow key={row.id} className="hover:bg-muted/40">
                        <TableCell className="px-4 py-3.5 whitespace-normal text-muted-foreground">
                          {formatWhen(row.at)}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 whitespace-normal">
                          <IssueCell row={row} />
                        </TableCell>
                        <TableCell className="px-4 py-3.5 whitespace-normal">
                          <Badge
                            className={`h-auto rounded-full px-2.5 py-1 text-sm ${meta.className}`}
                          >
                            {meta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3.5 font-mono text-base font-semibold whitespace-normal">
                          {row.amountUsdc == null ? '—' : formatUsdc(row.amountUsdc)}
                        </TableCell>
                        <TableCell className="max-w-0 px-4 py-3.5 whitespace-normal">
                          {row.contributor ? (
                            <GithubUserLink name={row.contributor} compact className="text-base" />
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 whitespace-normal">
                          {row.txHash ? (
                            <TxCell hash={row.txHash} />
                          ) : (
                            <span className="text-sm text-muted-foreground">GitHub</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </>
          )}
          <Pagination page={paged.page} totalPages={paged.totalPages} onPage={setPage} />
        </CardContent>
      </Card>
    </Tabs>
  );
}
