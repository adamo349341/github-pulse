import chalk from 'chalk';
import readline from 'readline';
import { ensureRepo, currentBranch, push as doPush } from '../git.js';
import { runPrePushChecks } from '../safety.js';

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

export async function push(options = {}) {
  await ensureRepo();
  const branch = await currentBranch();

  console.log(chalk.cyan(`🔍 Running pre-push safety checks on branch "${branch}"...`));

  const checks = await runPrePushChecks();

  if (!checks.ok) {
    console.log(chalk.red('\n🚨 Safety checks failed:'));
    for (const issue of checks.issues) {
      console.log(chalk.red(issue));
    }
    if (!options.yes) {
      const proceed = await confirm('\nPush anyway? (not recommended)', false);
      if (!proceed) {
        console.log(chalk.gray('Aborted — fix the issues first.'));
        process.exit(1);
      }
    }
  } else {
    console.log(chalk.green('✅ All safety checks passed.'));
  }

  if (!options.yes) {
    const ok = await confirm(`\nPush "${branch}" to origin?`, true);
    if (!ok) {
      console.log(chalk.gray('Aborted.'));
      process.exit(1);
    }
  }

  await doPush();
  console.log(chalk.green(`🚀 Pushed "${branch}" to origin!`));
}