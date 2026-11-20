import chalk from 'chalk';
import { getGitHubToken } from '../git.js';
import { getGitHubStats } from '../github-stats.js';

export async function profileCommand() {
  const token = getGitHubToken();
  if (!token) {
    console.log(chalk.red('❌ No GitHub token found. Set GITHUB_TOKEN or GH_TOKEN environment variable.'));
    process.exit(1);
  }

  console.log(chalk.cyan('🔍 Fetching GitHub profile and contribution stats...\n'));

  try {
    const stats = await getGitHubStats(token);
    console.log(chalk.bold.green(`👤 Connected to GitHub: @${stats.login} (${stats.name || 'No Name'})`));
    console.log(chalk.white(`   📦 Public Repositories: ${stats.publicRepos}`));
    console.log(chalk.white(`   🚀 Recent Push Events:  ${stats.recentCommits} sessions tracked`));
    console.log(chalk.white(`   🕒 Last Active:         ${stats.lastActive ? new Date(stats.lastActive).toLocaleString() : 'N/A'}\n`));
  } catch (err) {
    console.log(chalk.red(`❌ Failed to fetch GitHub stats: ${err.message}`));
    process.exit(1);
  }
}