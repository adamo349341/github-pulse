# ⚡ git-pulse

> An automated Git & GitHub workflow assistant with pre-commit safety rails, auto-generated commit messages, single-command PR creation, and automatic changelogs.

---

## 🚀 Features

- **📝 Automated Commit Messages:** Analyzes your staged `git diff` and generates clean [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `refactor:`).
- **🚨 Pre-Push Safety Rails:** Scans staged changes for hardcoded API keys, private keys, and oversized files before pushing.
- **✨ Single-Command Pull Requests:** Drafts and opens Pull Requests directly on GitHub using the GitHub REST API.
- **📜 Automatic Changelogs:** Parses git commit history between tags or commits to generate structured release notes categorized by features, bug fixes, and cleanups.
- **📊 Quick Repo Health Overview:** Clear status of branch, remote tracking, and staged vs unstaged file count.

---

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/your-username/git-pulse.git
cd git-pulse

# Install dependencies
npm install

# Link globally so you can use `git-pulse` anywhere
npm link
```

---

## 💡 Quick Start & Usage

```bash
# 1. Stage your changes as usual
git add .

# 2. Check repo health and staged changes
git-pulse status

# 3. Analyze diff, generate commit message, and commit safely
git-pulse commit

# 4. Run pre-push safety checks and push to remote
git-pulse push

# 5. Create a Pull Request directly on GitHub (requires GITHUB_TOKEN)
export GITHUB_TOKEN="your_github_personal_access_token"
git-pulse pr

# 6. Generate release notes / changelog
git-pulse changelog
```

---

## 🛡️ Safety Rail Rules

`git-pulse` automatically scans staged changes for:
- Exposed secrets (`API_KEY`, `SECRET`, Private Keys, GitHub PATs, AWS access keys).
- Oversized files (> 5MB) staged for commit.
- Prevents accidental commits to protected branches without confirmation.

---

## 🛠️ Tech Stack

- **Node.js** (ES Modules)
- **simple-git** for core Git plumbing
- **Commander.js** for clean CLI interface
- **Chalk** for rich terminal output
- **GitHub REST API** for Pull Request creation

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or pull requests.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git-pulse commit`)
4. Push to the branch (`git-pulse push`)
5. Open a Pull Request (`git-pulse pr`)

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
