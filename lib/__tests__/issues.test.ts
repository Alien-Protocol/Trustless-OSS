import { describe, expect, it } from 'vitest';
import { getActorUsername } from '../issues';

describe('getActorUsername', () => {
  it('returns null for null, undefined, or non-object inputs', () => {
    expect(getActorUsername(null)).toBeNull();
    expect(getActorUsername(undefined)).toBeNull();
    expect(getActorUsername('string')).toBeNull();
    expect(getActorUsername(123)).toBeNull();
  });

  it('returns null for missing actor data or empty objects', () => {
    expect(getActorUsername({})).toBeNull();
    expect(getActorUsername({ assignments: null })).toBeNull();
    expect(getActorUsername({ assignments: {} })).toBeNull();
    expect(getActorUsername({ assignments: { contributors: null } })).toBeNull();
  });

  it('filters out literal string "null" or "undefined" values', () => {
    expect(getActorUsername({ actor_username: 'null' })).toBeNull();
    expect(getActorUsername({ actor_username: 'undefined' })).toBeNull();
    expect(getActorUsername({ actor_username: '  NULL  ' })).toBeNull();
    expect(getActorUsername({ assignments: { contributors: 'null' } })).toBeNull();
    expect(
      getActorUsername({ assignments: { contributors: { github_username: 'null' } } })
    ).toBeNull();
  });

  it('extracts username from direct string fields on issue', () => {
    expect(getActorUsername({ actor_username: 'ryzen-xp' })).toBe('ryzen-xp');
    expect(getActorUsername({ github_username: '@ryzen-xp' })).toBe('ryzen-xp');
    expect(getActorUsername({ contributor_username: 'ryzen-xp' })).toBe('ryzen-xp');
    expect(getActorUsername({ assigned_username: 'ryzen-xp' })).toBe('ryzen-xp');
  });

  it('extracts username from direct objects on issue (actor, contributor, assignee)', () => {
    expect(getActorUsername({ actor: { github_username: 'ryzen-xp' } })).toBe('ryzen-xp');
    expect(getActorUsername({ contributor: { username: 'ryzen-xp' } })).toBe('ryzen-xp');
    expect(getActorUsername({ assignee: { login: 'ryzen-xp' } })).toBe('ryzen-xp');
    expect(getActorUsername({ actor: 'ryzen-xp' })).toBe('ryzen-xp');
  });

  it('extracts username from assignments object or array', () => {
    expect(
      getActorUsername({ assignments: { contributors: { github_username: 'ryzen-xp' } } })
    ).toBe('ryzen-xp');
    expect(
      getActorUsername({ assignments: [{ contributors: { github_username: 'ryzen-xp' } }] })
    ).toBe('ryzen-xp');
    expect(
      getActorUsername({ assignments: [{ contributors: [{ github_username: 'ryzen-xp' }] }] })
    ).toBe('ryzen-xp');
    expect(getActorUsername({ assignments: { contributor_github_username: 'ryzen-xp' } })).toBe(
      'ryzen-xp'
    );
    expect(getActorUsername({ assignments: [{ github_username: 'ryzen-xp' }] })).toBe('ryzen-xp');
  });

  it('extracts username from assignees array (GitHub API format)', () => {
    expect(getActorUsername({ assignees: [{ login: 'ryzen-xp' }] })).toBe('ryzen-xp');
    expect(getActorUsername({ assignees: ['ryzen-xp'] })).toBe('ryzen-xp');
    expect(getActorUsername({ assignees: ['null', 'ryzen-xp'] })).toBe('ryzen-xp');
  });
});
