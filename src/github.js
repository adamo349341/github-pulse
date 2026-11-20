import { getRemoteUrl, currentBranch, getLog } from './git.js';

/**
 * Extract "owner/repo" from a remote URL (supports HTTPS and SSH formats).
 * e.g. https://github.com/owner/repo.git -> owner/repo
 *       git@github.com:owner/repo.git -> owner/repo
 */
export function parseRemote(remoteUrl) {
  if (!remoteUrl) return null;

  // HTTPS: https://github.com/owner/repo(.git)?
  let match = remoteUrl.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (match) return { owner: match[1], repo: match[2] };

  // SSH: git@github.com:owner/repo(.git)?
  match = remoteUrl.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (match) return { owner: match[1], repo: match[2] };

  return null;
}

/**
 * Get the current GitHub repository info (owner/repo) from the git remote.
 */
export async function getRepoInfo() {
  const remoteUrl = await getRemoteUrl('origin');
  if (!remoteUrl) {
    throw new Error('No "origin" remote found. Add one with `git remote add origin <url>`.');
  }
  const info = parseRemote(remoteUrl);
  if (!info) {
    throw new Error(`Remote URL "${remoteUrl}" is not a recognized GitHub URL.`);
  }
  return info;
}

/**
 * Make an authenticated request to the GitHub API.
 */
async function ghRequest(token, method, path, body = null) {
  const url = `https://api.github.com${path}`;
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'git-pulse/1.0',
    Authorization: `Bearer ${token}`,
  };
  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GitHub API error (${res.status}): ${text || res.statusText}`);
  }

  return res.json();
}

/**
 * Create a Pull Request on GitHub.
 * Returns the created PR object.
 */
export async function createPullRequest(token, owner, repo, options) {
  const { title, body, head, base } = options;
  return ghRequest(token, 'POST', `/repos/${owner}/${repo}/pullrequests`, {
    title,
    body,
    head,
    base,
  });
}

/**
 * Get the authenticated user's login (to verify token works).
 */
export async function getUser(token) {
  return ghRequest(token, 'GET', '/user');
}