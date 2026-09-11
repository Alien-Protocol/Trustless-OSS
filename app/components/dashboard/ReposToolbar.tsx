'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { repoPageHref } from '@/lib/repo-filters';
import { REPO_SORTS, type RepoSort } from '@/lib/repo-filters';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const SORT_OPTIONS = REPO_SORTS.filter((option) => option.group === 'sort');
const FILTER_OPTIONS = REPO_SORTS.filter((option) => option.group === 'filter');

export default function ReposToolbar({ query, sort }: { query: string; sort: RepoSort }) {
  const router = useRouter();
  const [draft, setDraft] = useState(query);

  useEffect(() => {
    setDraft(query);
  }, [query]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (draft.trim() === query.trim()) return;
      router.push(repoPageHref(1, { q: draft, sort }));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [draft, query, router, sort]);

  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row">
      <div className="min-w-0 flex-1">
        <Label htmlFor="repo-search" className="sr-only">
          Search repositories
        </Label>
        <InputGroup className="h-10">
          <InputGroupAddon>
            <Search aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            id="repo-search"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Search repositories"
          />
        </InputGroup>
      </div>
      <div className="sm:w-56">
        <Label htmlFor="repo-sort" className="sr-only">
          Filter repositories
        </Label>
        <Select
          value={sort}
          onValueChange={(value) => {
            if (value === sort) return;
            router.push(repoPageHref(1, { q: draft, sort: value as RepoSort }));
          }}
        >
          <SelectTrigger id="repo-sort" className="h-10 w-full" aria-label="Filter repositories">
            <SelectValue placeholder="Deployed first" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Sort</SelectLabel>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Filter</SelectLabel>
              {FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
