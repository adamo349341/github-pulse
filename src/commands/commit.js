import chalk from 'chalk';
import readline from 'readline';
import { ensureRepo, hasStagedChanges, commit as doCommit } from '../git.js';
import { generateCommitMessage } from '../commit-msg.js';
import { scanSecrets } from '../safety.js';

/**
 * Confirm prompt helper — simple yes/no.
 */
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

export async function commit(options = {}) {
  await ensureRepo();

  if (!(await hasStagedChanges())) {
    console.log(chalk.yellow('⚠️  No staged changes. Stage files first with `git add`.'));
    process.exit(1);
  }

  // Generate or use provided message
  let message = options.message;
  if (!message) {
    message = await generateCommitMessage();
  }

  console.log(chalk.cyan('📝 Generated commit message:'));
  console.log(chalk.white('   ' + message));

  // Scan for secrets before committing
  const secrets = await scanSecrets();
  if (secrets.length > 0) {
    console.log(chalk.red('\n🚨 Potential secrets detected in staged changes:'));
    for (const s of secrets) {
      console.log(chalk.red(`   - ${s.file}: ${s.match}`));
    }
    if (!options.yes) {
      const proceed = await confirm('\nCommit anyway?', false);
      if (!proceed) {
        console.log(chalk.gray('Aborted.'));
        process.exit(1);
      }
    }
  }

  // Confirm
  if (!options.yes) {
    const ok = await confirm('\nCommit with this message?', true);
    if (!ok) {
      console.log(chalk.gray('Aborted.'));
      process.exit(1);
    }
  }

  await doCommit(message);
  console.log(chalk.green('✅ Committed!'));
}