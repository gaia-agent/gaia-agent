# GAIA Benchmark Answer Validation

This document explains how the GAIA benchmark validates agent answers.

## Validation Logic

### Current Implementation

The validation is performed in `benchmark/evaluator.ts` using bidirectional substring matching with normalization:

```typescript
const correct = task.answer
  ? normalizeAnswer(answer).includes(normalizeAnswer(task.answer)) ||
    normalizeAnswer(task.answer).includes(normalizeAnswer(answer))
  : false;
```

### Normalization Process

Before comparison, both the expected answer and agent's answer are normalized using the `normalizeAnswer()` function:

```typescript
export function normalizeAnswer(answer: string): string {
  return answer
    .toLowerCase()        // Convert to lowercase
    .trim()               // Remove leading/trailing whitespace
    .replace(/\s+/g, " ") // Collapse multiple spaces into single space
    .replace(/[^\w\s]/g, ""); // Remove all punctuation
}
```

**Example:**
- Input: `"The Answer is: 1,927!"`
- Output: `"the answer is 1927"`

### Matching Strategy

The validation uses **bidirectional substring matching**:

1. **Agent answer contains expected answer** (most common case)
   - Expected: `"1927"`
   - Agent: `"The answer is 1927 based on research"`
   - Normalized expected: `"1927"`
   - Normalized agent: `"the answer is 1927 based on research"`
   - Result: ✅ CORRECT (agent contains expected)

2. **Expected answer contains agent answer** (rare edge case)
   - Expected: `"Albert Einstein developed the theory"`
   - Agent: `"Einstein"`
   - Normalized expected: `"albert einstein developed the theory"`
   - Normalized agent: `"einstein"`
   - Result: ✅ CORRECT (expected contains agent)

### GAIA Answer Format

GAIA benchmark expects **short, direct answers**:

| Question | Expected Answer | Bad Answer | Good Answer |
|----------|----------------|------------|-------------|
| What year was X founded? | `1927` | `The answer is 1927 because...` | `1927` |
| Who invented Y? | `Albert Einstein` | `Based on research, Albert Einstein invented...` | `Albert Einstein` |
| Calculate 15 * 23 | `345` | `The calculation gives us 345` | `345` |

## Common Issues

### Problem: Verbose Agent Responses

**Before optimization:**
```
Agent Answer: "Based on my research, the company was founded in 1927. 
This information was found in the Wikipedia article about..."
```

**After optimization:**
```
Agent Answer: "1927"
```

### Solution: Updated System Instructions

We updated `DEFAULT_INSTRUCTIONS` in `src/config/defaults.ts` to emphasize concise answers:

```typescript
CRITICAL: When providing your final answer, be EXTREMELY CONCISE.
- Provide ONLY the direct answer with no explanation, no introduction, no reasoning
- Examples:
  - For "What year was X founded?" → Answer: "1927" (NOT "The answer is 1927 because...")
  - For "Who invented Y?" → Answer: "Albert Einstein" (NOT "Based on my research, Albert Einstein invented...")
  - For "Calculate 15 * 23" → Answer: "345" (NOT "The calculation gives us 345")
- Your final response should be the bare minimum needed to answer the question
- Do NOT add phrases like "The answer is", "Based on", "According to", etc.
```

## Validation Examples

### Example 1: Exact Match After Normalization

```typescript
Expected: "1927"
Agent:    "1927"

normalizeAnswer("1927") = "1927"
normalizeAnswer("1927") = "1927"

Result: ✅ CORRECT (exact match)
```

### Example 2: Agent Answer Contains Expected

```typescript
Expected: "Einstein"
Agent:    "Albert Einstein"

normalizeAnswer("Einstein") = "einstein"
normalizeAnswer("Albert Einstein") = "albert einstein"

"albert einstein".includes("einstein") = true

Result: ✅ CORRECT
```

### Example 3: Verbose Response Still Valid

```typescript
Expected: "1927"
Agent:    "The year 1927"

normalizeAnswer("1927") = "1927"
normalizeAnswer("The year 1927") = "the year 1927"

"the year 1927".includes("1927") = true

Result: ✅ CORRECT (but not optimal - should be just "1927")
```

### Example 4: Incorrect Answer

```typescript
Expected: "1927"
Agent:    "1928"

normalizeAnswer("1927") = "1927"
normalizeAnswer("1928") = "1928"

"1928".includes("1927") = false
"1927".includes("1928") = false

Result: ❌ INCORRECT
```

## Official GAIA Benchmark Standard

The official GAIA benchmark uses similar normalization strategies. From the [GAIA paper](https://arxiv.org/abs/2311.12983):

> "We consider an answer correct if it matches the ground truth after normalization (lowercase, whitespace removal, punctuation removal)."

Our implementation follows this standard with bidirectional matching to handle cases where agents might provide slightly more or less information than expected.

## Best Practices for Agent Development

1. **Concise Final Answers**: Train agents to provide minimal, direct answers
2. **No Explanations in Final Response**: Save reasoning for intermediate steps
3. **Test with Normalization**: Always test answers with `normalizeAnswer()` to see how they'll be evaluated
4. **Stream Mode for Debugging**: Use `--stream` flag to see agent's thinking process:
   ```bash
   pnpm benchmark:random --stream
   ```

## Testing Validation Logic

Unit tests for the validation logic can be found in `test/benchmark.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { normalizeAnswer } from '../benchmark/evaluator.js';

describe('normalizeAnswer', () => {
  it('should lowercase the answer', () => {
    expect(normalizeAnswer('HELLO')).toBe('hello');
  });

  it('should remove punctuation', () => {
    expect(normalizeAnswer('Hello, World!')).toBe('hello world');
  });

  it('should collapse whitespace', () => {
    expect(normalizeAnswer('Hello   World')).toBe('hello world');
  });

  it('should handle complex answers', () => {
    expect(normalizeAnswer('The Answer is: 1,927!')).toBe('the answer is 1927');
  });
});
```

Run tests with:
```bash
pnpm test test/benchmark.test.ts
```

## Future Improvements

Potential enhancements to validation logic:

- [ ] Fuzzy matching for typos (Levenshtein distance)
- [ ] Numerical tolerance for floating-point answers
- [ ] Multiple acceptable answer formats
- [ ] Semantic similarity scoring (embedding-based)

## References

- [GAIA Benchmark Paper](https://arxiv.org/abs/2311.12983)
- [GAIA Dataset on Hugging Face](https://huggingface.co/datasets/gaia-benchmark/GAIA)
- `benchmark/evaluator.ts` - Implementation
- `test/benchmark.test.ts` - Unit tests
