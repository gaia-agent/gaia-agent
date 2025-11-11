# Tests

Unit tests using [Vitest](https://vitest.dev/).

## Running Tests

```bash
# Run all tests once
pnpm test

# Watch mode (re-runs on file changes)
pnpm test:watch

# Interactive UI
pnpm test:ui

# Coverage report
pnpm test:coverage
```

## Test Structure

```
test/
├── benchmark.test.ts    # Benchmark utilities tests
└── tools.test.ts        # Core tools tests
```

## Writing Tests

Tests use Vitest's describe/it/expect API:

```typescript
import { describe, expect, it } from 'vitest';
import { normalizeAnswer } from '../benchmark/evaluator.js';

describe('normalizeAnswer', () => {
  it('should lowercase the answer', () => {
    expect(normalizeAnswer('HELLO')).toBe('hello');
  });
});
```

## Test Coverage

Coverage reports are generated with `pnpm test:coverage`:

```
Coverage Report
===============
File           | % Stmts | % Branch | % Funcs | % Lines
---------------|---------|----------|---------|--------
All files      |   85.2  |   78.9   |   92.1  |   84.8
```

Coverage excludes:
- `node_modules/`
- `dist/`
- `benchmark/`
- Test files (`*.test.ts`, `*.spec.ts`)

## Best Practices

1. **Unit Tests** - Test individual functions/utilities
2. **Integration Tests** - Test tool interactions (when not requiring API keys)
3. **Mock API Calls** - Use `vi.fn()` for external services
4. **Type Safety** - All tests use TypeScript with strict mode

## CI/CD

Tests can be integrated into CI pipelines:

```yaml
# .github/workflows/test.yml
- name: Run Tests
  run: pnpm test

- name: Upload Coverage
  run: pnpm test:coverage
```

## Future Test Areas

- [ ] Tool execution with mocked providers
- [ ] Agent response validation
- [ ] Benchmark result parsing
- [ ] Error handling scenarios
- [ ] Provider switching logic
