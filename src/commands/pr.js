import chalk from 'chalk';
import readline from 'readline';
import { ensureRepo, currentBranch, getGitHubToken } from '../git.js';
import { getRepoInfo, createPullRequest, getUser } from '../github.js';

function confirm(message, defaultValue = false) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const suffix = defaultValue ? ' [Y/n] ' : ' [y/N] ';
  return new Promise((resolve) => {
    rl.question(message + suffix, (answer) => {
      rl.close();
      const a = answer.trim().toLowerCase();
      if (a === '' || a === 'y' || a === 'yes') return resolve(true);
      if (a === 'n' || a === 'no') return resolve(false);
      resolve(defaultValue);
    });
  });
}

export async function pr(options = {}) {
  await ensureRepo();
  const token = getGitHubToken();
  if (!token) {
    console.log(chalk.red('❌ No GitHub token found.'));
    console.log(chalk.yellow('   Please set the GITHUB_TOKEN or GH_TOKEN environment variable.'));
    process.exit(1);
  }

  const branch = await currentBranch();
  if (branch === 'main' || branch === 'master') {
    console.log(chalk.red(`❌ You are currently on "${branch}". Create a feature branch first.`));
    process.exit(1);
  }

  const repoInfo = await getRepoInfo();
  console.log(chalk.cyan(`🔍 Connected to GitHub repository: ${repoInfo.owner}/${repoInfo.repo}`));

  // Verify token
  try {
    const user = await getUser(token);
    console.log(chalk.gray(`   Authenticated as @${user.login}`));
  } catch (err) {
    console.log(chalk.red(`❌ GitHub authentication failed: ${err.message}`));
    process.exit(1);
  }

  const title = options.title || `Feature: ${branch}`;
  const body = `## Summary\nAutomated PR created by [git-pulse](https://github.com/casius1/git-pulse).\n\n- Branch: \`${branch}\``;

  console.log(chalk.cyan('\n📋 Pull Request Details:'));
  console.log(chalk.white(`   Title: ${title}`));
  console.log(chalk.white(`   Head:  ${branch}`));
  console.log(chalk.white(`   Base:  main`));

  if (!options.yes) {
    const ok = await confirm('\nCreate this Pull Request on GitHub?', true);
    if (!ok) {
      console.log(chalk.gray('Aborted.'));
      process.exit(1);
    }
  }

  try {
    const prResult = await createPullRequest(token, repoInfo.owner, repoInfo.repo, {
      title,
      body,
      head: branch,
      base: 'main',
    });
    console.log(chalk.green(`\n✨ Pull Request created successfully!`));
    console.log(chalk.blue.underline(prResult.html_url));
  } catch (err) {
    console.log(chalk.red(`\n❌ Failed to create Pull Request: ${err.message}`));
    process.exit(1);
  }
}