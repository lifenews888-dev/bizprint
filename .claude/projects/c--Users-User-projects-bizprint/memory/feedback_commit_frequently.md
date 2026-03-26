---
name: Commit and Save Frequently
description: User wants frequent git commits and backups to prevent data loss during development
type: feedback
---

User explicitly asked to always protect work by saving/committing frequently.

**Why:** Untracked files were corrupted and couldn't be recovered from git. Work was lost and had to be manually reconstructed.

**How to apply:**
1. After completing any meaningful change: suggest `git add` + `git commit`
2. Before running any transformation script: ensure files are committed or backed up
3. Before risky operations (encoding fixes, bulk replacements, file rewrites): create a backup copy
4. Remind user to commit when significant progress is made
5. Never run destructive file operations on untracked/uncommitted files
