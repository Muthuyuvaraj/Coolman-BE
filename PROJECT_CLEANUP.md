# Project Cleanup and File Order

## Ordered project structure

The root folder is organized into the essential app files and source folders below:

- .gitignore
- .vscode/ (if created locally)
- components.json
- eslint.config.js
- index.html
- package.json
- package-lock.json
- postcss.config.js
- public/
- README.md
- src/
- tailwind.config.ts
- tsconfig.app.json
- tsconfig.json
- tsconfig.node.json
- vite.config.ts
- vitest.config.ts

## Unwanted files removed

The following generated or stale files were removed because they were not required for the active project source:

- dist/ — generated production build output
- bun.lock — generated dependency lock file from Bun; not needed in this project setup
- bun.lockb — binary Bun lockfile artifact; generated and not required for the current workflow

## Notes

- The working app dependencies remain in node_modules/ for local development.
- source files under src/ and public/ remain in place as the actual project code.
- package-lock.json is retained because this project is using npm-based tooling and package management.
