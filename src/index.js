#!/usr/bin/env node
import { Command } from 'commander';
import { commit } from './commands/commit.js';
import { push } from './commands/push.js';
import { pr } from './commands/pr.js';
import { changelog } from './commands/changelog.js';
import { status } from './commands/status.js';
import { profileCommand } from './commands/profile.js'; // New import

const program = new Command();

program
  .name('git-pulse')
  .description('Automated Git & GitHub workflow assistant with safety rails.')
  .version('1.0.0');

program.command('commit').description('Generate commit message + commit staged changes').action(commit);
program.command('push').description('Run pre-push safety checks, then push').action(push);
program.command('pr').description('Draft & open a Pull Request').action(pr);
program.command('changelog').description('Generate release notes').action(changelog);
program.command('status').description('Show a quick repo health overview').action(status);

// New Command
program
  .command('profile')
  .description('Show your connected GitHub profile and recent contribution stats.')
  .action(profileCommand);

program.parse();