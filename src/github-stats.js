import { Octokit } from 'octokit';

/**
 * Fetch GitHub profile data: user info and recent contributions.
 * Note: Contribution graphs via API are tricky; we use repos/events for recent activity.
 */
export async function getGitHubStats(token) {
  const octokit = new Octokit({ auth: token });

  // 1. Get User Profile
  const { data: user } = await octokit.rest.users.getAuthenticated();

  // 2. Get recent events (proxies for contributions)
  const { data: events } = await octokit.rest.activity.listPublicEventsForAuthenticatedUser({
    username: user.login,
    per_page: 20
  });

  // 3. Count commits in recent events
  const commitCount = events.filter(e => e.type === 'PushEvent').length;

  return {
    login: user.login,
    avatar: user.avatar_url,
    name: user.name,
    publicRepos: user.public_repos,
    recentCommits: commitCount,
    lastActive: events[0]?.created_at
  };
}