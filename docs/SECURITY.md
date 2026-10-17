# Security

- Secrets: none needed today. `.env` is git-ignored before the first commit; `.env.example`
  holds names only. gitleaks pre-commit hook blocks leaked keys. Turn on GitHub push protection.
- Auth: none (anonymous, browser-only). If ever needed, use a hosted provider; never hand-rolled.
- Access: all content is public and read-only. No user-submitted content.
- Rendering: imported text is rendered as text, never as raw HTML. External links use
  `rel="noopener noreferrer"`.
- Dependencies: ask before adding any. Prefer actively maintained packages. Commit the
  lockfile. Run `npm audit` before the demo.
- Node version is pinned in `.nvmrc`.
