import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureRepo, hasStagedChanges, currentBranch, commit as doCommit } from './git.js';
import { generateCommitMessage } from './commit-msg.js';
import { scanSecrets } from './safety.js';
import { getRepoInfo, getGitHubToken, createPullRequest, getUser } from './github.js';
import { getGitHubStats } from './github-stats.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../ui')));

// 1. Get Repo & GitHub Profile Status
app.get('/api/status', async (req, res) => {
  try {
    const git = await ensureRepo();
    const status = await git.status();
    const token = getGitHubToken();

    let ghUser = null;
    let stats = null;
    if (token) {
      try {
        ghUser = await getUser(token);
        stats = await getGitHubStats(token);
      } catch (e) {
        // Token might be invalid or network error
      }
    }

    res.json({
      success: true,
      branch: status.current,
      stagedCount: status.files.filter(f => f.index !== ' ').length,
      modifiedCount: status.files.filter(f => f.working_tree !== ' ').length,
      github: ghUser ? { login: ghUser.login, name: ghUser.name, repos: ghUser.public_repos } : null,
      stats: stats ? { recentCommits: stats.recentCommits } : null
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Auto Commit
app.post('/api/commit', async (req, res) => {
  try {
    if (!(await hasStagedChanges())) {
      return res.json({ success: false, message: 'No staged changes to commit.' });
    }
    const message = await generateCommitMessage();
    const secrets = await scanSecrets();

    if (secrets.length > 0 && !req.body.force) {
      return res.json({ success: false, warning: 'Secrets detected!', secrets });
    }

    await doCommit(message);
    res.json({ success: true, message: `Successfully committed: "${message}"` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Push
app.post('/api/push', async (req, res) => {
  try {
    const secrets = await scanSecrets();
    if (secrets.length > 0 && !req.body.force) {
      return res.json({ success: false, warning: 'Secrets detected in staged changes!', secrets });
    }
    const git = await ensureRepo();
    const branch = await currentBranch();
    await git.push('origin', branch);
    res.json({ success: true, message: `Successfully pushed "${branch}" to origin!` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Create PR
app.post('/api/pr', async (req, res) => {
  try {
    const token = getGitHubToken();
    if (!token) return res.json({ success: false, error: 'No GITHUB_TOKEN environment variable set.' });

    const branch = await currentBranch();
    if (branch === 'main' || branch === 'master') {
      return res.json({ success: false, error: `Cannot create PR from "${branch}". Switch to a feature branch.` });
    }

    const repoInfo = await getRepoInfo();
    const title = req.body.title || `Feature: ${branch}`;
    const body = `## Summary\nAutomated PR created by [git-pulse](https://github.com/casius1/git-pulse).\n\n- Branch: \`${branch}\``;

    const prResult = await createPullRequest(token, repoInfo.owner, repoInfo.repo, {
      title, body, head: branch, base: 'main'
    });

    res.json({ success: true, url: prResult.html_url });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n⚡ git-pulse web app running at: http://localhost:${PORT}\n`);
});
