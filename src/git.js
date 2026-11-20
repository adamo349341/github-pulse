import { simpleGit } from 'simple-git';

/**
 * Get a simple-git instance rooted at the current working directory.
 */
export function getGit() {
  return simpleGit();
}

/**
 * Ensure we are inside a git repository. Throws a friendly error otherwise.
 */
export async function ensureRepo() {
  const git = getGit();
  const isRepo = await git.status().catch(() => null);
  if (!isRepo) {
    throw new Error('Not a git repository. Run this command inside a git repo.');
  }
  return git;
}

/**
 * Get the current branch name.
 */
export async function currentBranch() {
  const git = await ensureRepo();
  const status = await git.status();
  return status.current;
}

/**
 * Get the current remote URL for a given remote (default "origin").
 */
export async function getRemoteUrl(remote = 'origin') {
  const git = await ensureRepo();
  const remotes = await git.getRemotes();
  const found = remotes.find((r) => r.name === remote);
  return found ? found.pushes : null;
}

/**
 * Get the diff of staged changes as a string.
 */
export async function getStagedDiff() {
  const git = await ensureRepo();
  return git.diff(['--cached']);
}

/**
 * Get the diff of unstaged changes as a string.
 */
export async function getUnstagedDiff() {
  const git = await ensureRepo();
  return git.diff();
}

/**
 * Get staged files (added/modified, not deleted).
 */
export async function getStagedFiles() {
  const git = await ensureRepo();
  const status = await git.status();
  return status.files
    .filter((f) => f.index !== ' ' && f.index !== '?')
    .map((f) => f.path);
}

/**
 * Get the full commit log between two refs, formatted for changelog generation.
 */
export async function getLog(fromRef, toRef) {
  const git = await ensureRepo();
  const log = await git.log({
    from: fromRef,
    to: toRef,
  });
  return log.all;
}

/**
 * Stage all changes.
 */
export async function stageAll() {
  const git = await ensureRepo();
  await git.add(['-A']);
}

/**
 * Commit with a message.
 */
export async function commit(message) {
  const git = await ensureRepo();
  await git.commit(message);
}

/**
 * Push to remote.
 */
export async function push(remote = 'origin', branch = null, force = false) {
  const git = await ensureRepo();
  const targetBranch = branch || (await currentBranch());
  const args = force ? ['--force-with-lease', remote, targetBranch] : [remote, targetBranch];
  await git.push(...args);
}

/**
 * Check if there are staged changes.
 */
export async function hasStagedChanges() {
  const git = await ensureRepo();
  const status = await git.status();
  return status.staged;
}

/**
 * Get list of recent tags.
 */
export async function getTags() {
  const git = await ensureRepo();
  const tags = await git.tags();
  return tags.tags;
}

/**
 * Check if a GitHub token is available (env var or gh CLI).
 */
export function getGitHubToken() {
  return process.env.GITHUB_TOKEN || process.env.GH_TOKEN || null;
}