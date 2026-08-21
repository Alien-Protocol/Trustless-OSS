export type IssueAssignment = {
  contributors?: {
    github_username?: string;
    login?: string;
    username?: string;
  } | null;
  contributor?: {
    github_username?: string;
    login?: string;
    username?: string;
  } | null;
  github_username?: string;
  login?: string;
  username?: string;
  payout_status?: string;
};

export type IssueItem = {
  id: string;
  github_issue_number: number;
  title: string;
  difficulty_label: string | null;
  reward_amount: number;
  status: string;
  assignments?: IssueAssignment | IssueAssignment[] | null;
  assignee?: { github_username?: string; login?: string; username?: string } | string | null;
  assignees?: Array<{ github_username?: string; login?: string; username?: string } | string> | null;
  actor_username?: string | null;
  github_username?: string | null;
  actor?: string | { github_username?: string; login?: string } | null;
};

export function getActorUsername(issue: Partial<IssueItem> | null | undefined): string | null {
  if (!issue || typeof issue !== 'object') return null;

  const rawAssignments = issue.assignments;
  const assignment = Array.isArray(rawAssignments) ? rawAssignments[0] : rawAssignments;

  let username: string | undefined | null = null;

  if (assignment && typeof assignment === 'object') {
    const contrib = assignment.contributors || assignment.contributor;
    if (contrib && typeof contrib === 'object') {
      username = contrib.github_username || contrib.login || contrib.username;
    }
    if (!username) {
      username = assignment.github_username || assignment.login || assignment.username;
    }
  }

  if (!username) {
    if (typeof issue.assignee === 'object' && issue.assignee !== null) {
      username = issue.assignee.github_username || issue.assignee.login || issue.assignee.username;
    } else if (typeof issue.assignee === 'string') {
      username = issue.assignee;
    } else if (Array.isArray(issue.assignees) && issue.assignees.length > 0) {
      const firstAssignee = issue.assignees[0];
      if (typeof firstAssignee === 'object' && firstAssignee !== null) {
        username = firstAssignee.github_username || firstAssignee.login || firstAssignee.username;
      } else if (typeof firstAssignee === 'string') {
        username = firstAssignee;
      }
    } else if (typeof issue.actor === 'object' && issue.actor !== null) {
      username = issue.actor.github_username || issue.actor.login;
    } else if (typeof issue.actor === 'string') {
      username = issue.actor;
    } else if (typeof issue.actor_username === 'string') {
      username = issue.actor_username;
    } else if (typeof issue.github_username === 'string') {
      username = issue.github_username;
    }
  }

  if (typeof username !== 'string') return null;

  const cleaned = username.trim().replace(/^@/, '');
  const lower = cleaned.toLowerCase();

  if (!cleaned || lower === 'null' || lower === 'undefined' || lower === '[object object]') {
    return null;
  }

  return cleaned;
}

export function normalizeIssues(rawIssues: unknown): IssueItem[] {
  if (!Array.isArray(rawIssues)) return [];
  return rawIssues.map((issue: unknown) => {
    if (!issue || typeof issue !== 'object') return issue as IssueItem;
    const issueObj = issue as Partial<IssueItem>;
    const actor = getActorUsername(issueObj);
    let assignments = issueObj.assignments;

    if (Array.isArray(assignments)) {
      assignments = assignments[0] ?? null;
    }

    if (actor) {
      assignments = {
        ...(typeof assignments === 'object' && assignments !== null ? assignments : {}),
        contributors: {
          github_username: actor,
        },
      };
    }

    return {
      ...(issueObj as IssueItem),
      assignments,
    };
  });
}
