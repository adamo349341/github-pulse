import { getStagedDiff, getStagedFiles } from './git.js';

/**
 * Patterns that suggest a hardcoded secret/credential.
 */
const SECRET_PATTERNS = [
  /API_KEY\s*=\s*['"][^'"]+['"]/i,
  /SECRET\s*=\s*['"][^'"]+['"]/i,
  /TOKEN\s*=\s*['"][^'"]+['"]/i,
  /PASSWORD\s*=\s*['"][^'"]+['"]/i,
  /BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY/i,
  /ghp_[A-Za-z0-9]{20,}/, // GitHub PAT
  /sk-[A-Za-z0-9]{20,}/, // OpenAI/Anthropic key
  /AKIA[0-9A-Z]{16}/, // AWS Access Key
];

/**
 * Scan staged diff for potential secrets.
 * Returns an array of { file, line, match } objects.
 */
export async function scanSecrets() {
  const diff = await getStagedDiff();
  const findings = [];
  const lines = diff.split('\n');
  let currentFile = '';

  for (const line of lines) {
    if (line.startsWith('+++ b/')) {
      currentFile = line.slice(6);
      continue;
    }
    if (line.startsWith('+++ ')) continue;
    // Only check added lines (starting with +)
    if (!line.startsWith('+')) continue;
    const content = line.slice(1);
    for (const pattern of SECRET_PATTERNS) {
      const match = content.match(pattern);
      if (match) {
        findings.push({
          file: currentFile || 'unknown',
          line: content.trim(),
          match: match[0],
        });
      }
    }
  }
  return findings;
}

/**
 * Check for oversized files in the staging area.
 * Returns files larger than 5MB.
 */
export async function scanOversizedFiles(limitMb = 5) {
  const files = await getStagedFiles();
  const limit = limitMb * 1024 * 1024;
  const results = [];
  for (const file of files) {
    try {
      const stat = await Bun.file(file).stat?.() ?? null;
      if (stat && stat.size > limit) {
        results.push({ file, size: stat.size });
      }
    } catch {
      // File may not exist or be inaccessible; skip.
    }
  }
  return results;
}

/**
 * Run all pre-push safety checks.
 * Returns { ok: boolean, issues: string[] }.
 */
export async function runPrePushChecks() {
  const issues = [];

  // 1. Secrets scan
  const secrets = await scanSecrets();
  if (secrets.length > 0) {
    issues.push(`⚠️  Potential secrets detected in ${secrets.length} staged line(s):`);
    for (const s of secrets) {
      issues.push(`   - ${s.file}: ${s.match}`);
    }
  }

  // 2. Oversized files
  const oversized = await scanOversizedFiles();
  if (oversized.length > 0) {
    issues.push(`⚠️  Oversized files (>5MB) staged:`);
    for (const o of oversized) {
      issues.push(`   - ${o.file} (${(o.size / 1024 / 1024).toFixed(1)}MB)`);
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}