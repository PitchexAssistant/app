# Feature-Based Development Guidelines (Next.js – Beginner Level)

These guidelines define a simple, consistent way to structure and write code in a beginner-friendly Next.js project.  
The goal is **clarity, separation of concerns, maintainability and production-level optimization**.

---

## 1. Separation of Concerns

Each layer has a **single responsibility**.

### Components
- UI and interaction only.
- No API calls or business logic.
- Receive data via props or hooks.
- Keep components small and readable.

### Hooks
- Reusable logic (state, fetching, derived data).
- Encapsulate side effects.
- No UI or JSX.

### API Layer
- All API calls live here.
- No API logic inside components.
- Return typed data only.

### Utils / Lib
- `utils/`: Pure helper functions.
- `lib/`: Shared services (API client, auth helpers).

---

## 2. Feature-Based Folder Structure

Each feature must follow this structure:
feature/
┣ api/
┣ components/
┣ hooks/
┣ utils/
┣ constants.ts
┣ types.ts
┗ index.ts



Rules:
- Features are self-contained.
- Do not import from another feature’s internal folders.
- Share only what is exported from `index.ts`.

---

## 3. Single Responsibility Rule

- One file = one purpose.
- One function = one task.
- Split UI, logic, and data handling.
- Avoid large components or “god hooks”.

---

## 4. No Redundancy

- Do not duplicate logic across layers.
- Reuse hooks, helpers, and constants.
- Centralize shared logic instead of copy-pasting.

---

## 5. Basic Type Safety

- No `any`.
- Type props, API responses, and hook returns.
- Keep shared types in `types.ts`.
- Keep constants in `constants.ts`.

---

## 6. Import Order

Follow this order:
1. React / Next.js
2. Third-party libraries
3. Internal absolute imports (`@/feature`)
4. Relative imports

Avoid deep or circular imports.

---

## 7. Clean Code Rules

- No commented-out or dead code.
- No verbose inline comments.
- Code should be readable on its own.
- Use short `TODO:` comments only when necessary.

---

## 8. Antigravity Expectations

When Antigravity refactors code:
- Output complete working code.
- Follow the feature-based structure.
- Remove unused logic and duplication.
- Keep code simple and readable.
- No explanations inside code.

---
