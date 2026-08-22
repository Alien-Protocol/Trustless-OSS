export function getActorUsername(issue: unknown): string | null {
  if (!issue || typeof issue !== 'object') return null;

  const item = issue as Record<string, any>;

  const clean = (val: unknown): string | null => {
    if (typeof val !== 'string') return null;
    const trimmed = val.trim().replace(/^@/, '');
    if (
      !trimmed ||
      trimmed.toLowerCase() === 'null' ||
      trimmed.toLowerCase() === 'undefined'
    ) {
      return null;
    }
    return trimmed;
  };

  const extractFromUserObj = (userObj: unknown): string | null => {
    if (!userObj) return null;
    if (Array.isArray(userObj)) {
      for (const entry of userObj) {
        const res = extractFromUserObj(entry);
        if (res) return res;
      }
      return null;
    }
    if (typeof userObj === 'string') return clean(userObj);
    if (typeof userObj === 'object') {
      const u = userObj as Record<string, any>;
      return (
        clean(u.github_username) ??
        clean(u.username) ??
        clean(u.login) ??
        clean(u.actor_username) ??
        clean(u.contributor_username) ??
        clean(u.handle) ??
        clean(u.github_handle) ??
        clean(u.name)
      );
    }
    return null;
  };

  // Direct username string/object fields on issue
  const directResult =
    clean(item.actor_username) ??
    clean(item.contributor_username) ??
    clean(item.assigned_username) ??
    clean(item.github_username) ??
    extractFromUserObj(item.actor) ??
    extractFromUserObj(item.contributor) ??
    extractFromUserObj(item.assignee) ??
    extractFromUserObj(item.assigned_actor) ??
    extractFromUserObj(item.assigned_contributor);

  if (directResult) return directResult;

  // Check assignments field (can be object or array)
  let assignment = item.assignments ?? item.assignment;
  if (Array.isArray(assignment)) {
    assignment = assignment[0];
  }

  if (assignment && typeof assignment === 'object') {
    const assignObj = assignment as Record<string, any>;
    const assignResult =
      clean(assignObj.github_username) ??
      clean(assignObj.actor_username) ??
      clean(assignObj.contributor_username) ??
      clean(assignObj.contributor_github_username) ??
      clean(assignObj.username) ??
      extractFromUserObj(assignObj.contributors) ??
      extractFromUserObj(assignObj.contributor) ??
      extractFromUserObj(assignObj.user) ??
      extractFromUserObj(assignObj.users) ??
      extractFromUserObj(assignObj.actor);

    if (assignResult) return assignResult;
  }

  // Check assignees array (GitHub API format)
  if (Array.isArray(item.assignees) && item.assignees.length > 0) {
    for (const assignee of item.assignees) {
      const result = extractFromUserObj(assignee);
      if (result) return result;
    }
  }

  return null;
}

