import chalk from 'chalk';
import { ensureRepo, currentBranch, getRemoteUrl, getTags } from '../git.js';

export async function status() {
  const git = await ensureRepo();

  const summary = await git.status();
  const branch = summary.current;
  const tracking = summary.tracking ? ` → ${summary.tracking}` : '';

  console.log(chalk.bold.cyan('\n📊 git-pulse status\n'));

  console.log(chalk.white(`   Branch:   ${chalk.green(branch)}${tracking}`));
  console.log(chalk.white(`   Remote:   ${summary.tracking || 'none'}`));

  const staged = summary.files.filter((f) => f.index !== ' ').length;
  const unstaged = summary.files.filter((f) => f.working_tree !== ' ').length;
  const untracked = summary.files.filter((f) => f.index === '?' && f.working_tree === '?').length;

  console.log(chalk.white(`   Staged:   ${chalk.yellow(staged)} file(s)`));
  console.log(chalk.white(`   Modified: ${chalk.yellow(unstaged)} file(s)`));
  console.log(chalk.white(`   Untracked: ${chalk.gray(untracked)} file(s)`));

  if (summary.staged) {
    console.log(chalk.green('\n✅ Ready to commit! Run `git-pulse commit`'));
  } else {
    console.log(chalk.gray('\n💡 Stage files first with `git add`'));
  }

  console.log('');
}