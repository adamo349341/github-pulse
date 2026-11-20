import { getStagedDiff, getStagedFiles } from './git.js';

/**
 * Generate a Conventional Commit message from the staged diff.
 * Format: <type>(<scope>): <description>
 *
 * Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
 */
export async function generateCommitMessage() {
  const diff = await getStagedDiff();
  const files = await getStagedFiles();

  if (!diff.trim()) {
    throw new Error('No staged changes to commit. Stage files first with `git add`.');
  }

  // Determine type from file paths / diff content
  const type = classifyType(files, diff);
  const scope = inferScope(files);
  const description = summarizeChanges(files, diff);

  const scopePart = scope ? `(${scope})` : '';
  return `${type}${scopePart}: ${description}`;
}

/**
 * Classify the commit type based on changed files and diff content.
 */
function classifyType(files, diff) {
  const lower = (diff + files.join(' ')).toLowerCase();

  // Documentation
  if (files.some((f) => /\.(md|rst|txt|adoc)$/i.test(f)) && !files.some((f) => /\.(js|ts|py|go|java)$/i.test(f))) {
    return 'docs';
  }

  // Tests
  if (files.some((f) => /test|spec|__tests__|\.test\./i.test(f))) {
    return 'test';
  }

  // CI / build config
  if (files.some((f) => /workflow|\.github|dockerfile|makefile|package\.json|cargo\.toml|go\.mod|build\.gradle/i.test(f))) {
    return 'build';
  }

  // Style / formatting
  if (files.some((f) => /\.(css|scss|less|html|json|yml|yaml)$/i.test(f)) && diff.includes('format')) {
    return 'style';
  }

  // Performance keywords
  if (lower.includes('performance') || lower.includes('optimize') || lower.includes('speed')) {
    return 'perf';
  }

  // Refactor indicators
  if (lower.includes('refactor') || lower.includes('cleanup') || lower.includes('simplify')) {
    return 'refactor';
  }

  // Fix indicators
  if (lower.includes('fix') || lower.includes('bug') || lower.includes('error') || lower.includes('issue')) {
    return 'fix';
  }

  // Default to feat
  return 'feat';
}

/**
 * Infer a scope (module/component name) from changed file paths.
 */
function inferScope(files) {
  for (const file of files) {
    const parts = file.split('/');
    if (parts.length > 1) {
      // Take the first meaningful directory (skip common ones)
      const skip = new Set(['src', 'lib', 'app', 'packages', 'components', 'pages', 'tests', 'test']);
      for (const p of parts) {
        if (!skip.has(p.toLowerCase()) && p.length > 1) {
          return p;
        }
      }
      return parts[0];
    }
  }
  return null;
}

/**
 * Summarize changes into a short human-readable description.
 */
function summarizeChanges(files, diff) {
  const count = files.length;
  if (count === 1) {
    return `update ${files[0]}`;
  }

  // Count added/removed lines
  let added = 0;
  let removed = 0;
  for (const line of diff.split('\n')) {
    if (line.startsWith('+') && !line.startsWith('+++')) added++;
    if (line.startsWith('-') && !line.startsWith('---')) removed++;
  }

  if (added > removed * 2) {
    return `add ${count} new file(s) with ${added} additions`;
  }
  if (removed > added * 2) {
    return `remove ${count} file(s) with ${removed} deletions`;
  }
  return `update ${count} files (+${added} -${removed})`;
}