export const GITHUB_INSTALL_SUCCESS = 'github-installation-success';
export const GITHUB_INSTALL_FAILED = 'github-installation-failed';

export type GitHubInstallFailedMessage = {
  type: typeof GITHUB_INSTALL_FAILED;
  message: string;
};

export function isGitHubInstallFailedMessage(data: unknown): data is GitHubInstallFailedMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    data.type === GITHUB_INSTALL_FAILED &&
    'message' in data &&
    typeof data.message === 'string'
  );
}
