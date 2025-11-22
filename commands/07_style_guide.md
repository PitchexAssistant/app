# Style Guide

Adhere to the following coding standards to maintain codebase quality.

## Backend (Python)

### PEP 8
Follow PEP 8 guidelines for code formatting.

### Linters & Formatters
- **Ruff / Black**: Use Black for formatting and Ruff for linting.
- **Type Hinting**: Use type hints for all function arguments and return values.

```python
def calculate_score(value: int) -> float:
    return value * 1.5
```

### Naming Conventions
- **Variables/Functions**: `snake_case`
- **Classes**: `PascalCase`
- **Constants**: `UPPER_CASE`

## Frontend (TypeScript/React)

### ESLint & Prettier
Ensure ESLint and Prettier are configured and running.

### Naming Conventions
- **Components**: `PascalCase` (e.g., `MyComponent.tsx`)
- **Functions/Variables**: `camelCase`
- **Interfaces/Types**: `PascalCase`

### React Best Practices
- Use Functional Components with Hooks.
- Avoid large components; break them down into smaller, reusable parts.
- Use `const` for all variable declarations.

## Git Commit Messages
Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

- `feat: add emotion analysis service`
- `fix: resolve login timeout issue`
- `docs: update architecture guide`
- `style: format code with black`
- `refactor: optimize database query`
