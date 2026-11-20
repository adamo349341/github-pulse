import chalk from 'chalk';
import { ensureRepo, getLog, getTags } from '../git.js';

export async function changelog(options = {}) {
  await ensureRepo();

  const from = options.from || 'HEAD~50';
  const to = options.to || 'HEAD';

  console.log(chalk.cyan(`📜 Generating changelog from ${from} to ${to}...\n`));

  const commits = await getLog(from, to);

  const feats = [];
  const fixes = [];
  const others = [];

  for (const c of commits) {
    const msg = c.message.trim();
    if (msg.startsWith('feat') || msg.startsWith('feature')) {
      feats.push(`- ${msg} (${c.hash.slice(0, 7)})`);
    } else if (msg.startsWith('fix') || msg.startsWith('bug')) {
      fixes.push(`- ${msg} (${c.hash.slice(0, 7)})`);
    } else {
      others.push(`- ${msg} (${c.hash.slice(0, 7)})`);
    }
  }

  console.log(chalk.bold('## Changelog\n'));

  if (feats.length > 0) {
    console.log(chalk.green('### Features'));
    console.log(feats.join('\n') + '\n');
  }

  if (fixes.length > 0) {
    console.log(chalk.yellow('### Bug Fixes'));
    console.log(fixes.join('\n') + '\n');
  }

  if (others.length > 0) {
    console.log(chalk.gray('### Other Changes'));
    console.log(others.join('\n') + '\n');
  }
}