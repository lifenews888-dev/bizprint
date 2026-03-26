---
name: File Safety — Never Corrupt Files
description: Critical rule — always backup before byte-level operations, never use code & 0xFF on UTF-8 files, git stash before risky edits
type: feedback
---

NEVER run byte-level encoding fixes (like `charCode & 0xFF`) on files — this destroyed Mongolian text by truncating multi-byte UTF-8 chars to U+FFFD.

**Why:** A Node.js script with `code & 0xFF` corrupted editor/page.tsx (119 lines of Mongolian text lost). File was untracked in git so no recovery was possible — had to manually reconstruct every line.

**How to apply:**
1. Before ANY file transformation script: `git stash` or `cp file file.bak` first
2. For encoding fixes: use `iconv` or proper decode→encode chains, NEVER truncate codepoints
3. For Mongolian text fixes: use line-by-line replacement with known-good strings, not byte manipulation
4. After editing: immediately verify with `grep -c $'\xef\xbf\xbd'` (check for U+FFFD)
5. Prefer `Edit` tool over scripts for text replacement — it's atomic and reversible
