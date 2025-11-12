# Enhanced ReAct Planner for GAIA Benchmark

## Overview

The Enhanced ReAct (Reasoning + Acting) Planner is a strategic improvement to the GAIA Agent that implements structured reasoning patterns to improve benchmark performance. This feature provides better task decomposition, systematic tool usage, and self-verification mechanisms.

## What is ReAct?

ReAct is a framework that combines **Reasoning** and **Acting** in a structured loop:

```
Think → Plan → Act → Observe → Reflect
```

### The ReAct Cycle

1. **ANALYZE (Think)**: Understand the question, identify what's needed
2. **PLAN**: Choose the right strategy based on task type
3. **ACT**: Execute using appropriate tools
4. **OBSERVE**: Analyze tool results and determine next steps
5. **REFLECT**: Verify answer quality before submission

## Why ReAct Improves Performance

### Traditional Approach
```typescript
// Basic instructions: Generic guidance
const agent = createGaiaAgent();
// Result: Agent may jump directly to tools without planning
```

### ReAct Approach
```typescript
// Enhanced instructions: Structured reasoning phases
const agent = createGaiaAgent({ useReActPlanner: true });
// Result: Agent follows systematic thinking → planning → action cycle
```

### Key Improvements

1. **Structured Thinking**: Forces agent to analyze before acting
2. **Task-Aware Strategy**: Automatically detects question patterns (factual, math, code, browser, files)
3. **Better Tool Selection**: Matches tools to task type systematically
4. **Self-Verification**: Built-in reflection phase catches errors
5. **Multi-Step Tracking**: Memory system for complex workflows

## Usage

### Basic Usage

```typescript
import { createGaiaAgent } from '@gaia-agent/sdk';

// Create agent with enhanced ReAct planner
const agent = createGaiaAgent({
  useReActPlanner: true,  // Enable structured reasoning
});

const result = await agent.generate({
  messages: [{ role: 'user', content: 'What year was Tesla founded?' }],
});

console.log(result.text);  // "2003"
```

### Task-Aware Instructions

The planner automatically detects task patterns and adjusts strategy:

```typescript
import { createTaskAwareInstructions } from '@gaia-agent/sdk';

// Detects factual question and suggests search + verification
const instructions1 = createTaskAwareInstructions(
  "What year was X founded?",
  false
);

// Detects calculation and suggests calculator/sandbox
const instructions2 = createTaskAwareInstructions(
  "Calculate the sum of...",
  false
);

// Detects file processing and suggests sandbox with pandas
const instructions3 = createTaskAwareInstructions(
  "Analyze this CSV file",
  true  // hasFiles
);
```

### Confidence Estimation

Estimate answer quality based on multiple signals:

```typescript
import { estimateConfidence } from '@gaia-agent/sdk';

const result = await agent.generate({ messages });

const confidence = estimateConfidence({
  stepsCount: result.steps?.length,
  toolsUsed: result.steps?.flatMap(s => 
    s.toolCalls ? s.toolCalls.map(tc => tc.toolName) : []
  ),
  hasError: false,
  answerLength: result.text?.length,
});

console.log(`Confidence: ${confidence}%`);

if (confidence < 70) {
  // Low confidence - retry with different approach
}
```

### Reflection Mechanism

Verify answers before submission:

```typescript
import { reflectOnAnswer } from '@gaia-agent/sdk';

const task = {
  id: 'task-123',
  question: 'What year was Tesla founded?',
  answer: '2003',
  level: 1,
};

const proposedAnswer = "2003";

const reflection = await reflectOnAnswer(
  agent,
  task,
  proposedAnswer,
  true  // verbose
);

console.log('Should retry:', reflection.shouldRetry);
console.log('Confidence:', reflection.confidence);
console.log('Reflection:', reflection.reflection);
```

## Task Patterns Recognized

### 1. Factual Questions
**Pattern**: Contains "when", "who", "where", "what year", "founded", "invented"

**Strategy**:
- Use search for authoritative sources
- Prefer Wikipedia, official sites, .gov, .edu
- Use searchGetContents for verification
- Cross-check from multiple sources

**Example**:
```typescript
// Question: "Who invented the telephone?"
// Detected: Factual question
// Strategy: search → verify → cross-check → answer
```

### 2. Mathematical Tasks
**Pattern**: Contains "calculate", "compute", "sum", "average", "multiply", "divide"

**Strategy**:
- Simple arithmetic (2-3 operations) → calculator
- Complex calculations → sandbox with Python
- Data analysis → sandbox with pandas/numpy
- Always verify with second method if uncertain

**Example**:
```typescript
// Question: "Calculate 157 × 89"
// Detected: Mathematical task
// Strategy: calculator → verify → answer
```

### 3. Code/Programming Tasks
**Pattern**: Contains "code", "program", "script", "function", "algorithm"

**Strategy**:
- Use sandbox with appropriate language
- Test with example inputs
- Handle edge cases
- Return only requested output

**Example**:
```typescript
// Question: "Write a function to sort..."
// Detected: Code task
// Strategy: sandbox → test → verify → answer
```

### 4. Web Interaction
**Pattern**: Contains "website", "webpage", "url", "navigate", "click"

**Strategy**:
- Dynamic sites (JavaScript) → browser tool
- Static content → search + searchGetContents
- Take screenshots for verification
- Handle popups and page loads

**Example**:
```typescript
// Question: "Visit website X and find Y"
// Detected: Browser task
// Strategy: browser → screenshot → extract → answer
```

### 5. File Processing
**Pattern**: Has attached files (CSV, PDF, images, Excel)

**Strategy**:
- CSV → sandbox with pandas
- PDF → sandbox with PyPDF2/pdfplumber
- Images → sandbox with PIL/Pillow
- Excel → sandbox with pandas
- Extract requested data only

**Example**:
```typescript
// Question: "What's the average in column B?" (with CSV file)
// Detected: File processing task
// Strategy: sandbox + pandas → calculate → answer
```

## ReAct Planner Instructions

The full ReAct planner instructions are available as:

```typescript
import { REACT_PLANNER_INSTRUCTIONS } from '@gaia-agent/sdk';

console.log(REACT_PLANNER_INSTRUCTIONS);
```

Key sections:
1. **ReAct Framework**: 5-phase structured reasoning
2. **Available Tools**: Comprehensive tool documentation
3. **Task Patterns**: 5 recognized patterns with strategies
4. **Multi-Step Workflow**: For complex Level 2-3 tasks
5. **Critical Success Factors**: Tool selection, verification, error recovery, memory usage
6. **Answer Format**: Strict format guidelines
7. **Quality Checklist**: Pre-submission verification
8. **Performance Tips**: Best practices

## Reflection Prompts

Pre-built reflection prompts for answer verification:

```typescript
import { REFLECTION_PROMPT, CONFIDENCE_ESTIMATION_PROMPT } from '@gaia-agent/sdk';

// Use in custom workflows
const reflectionResult = await agent.generate({
  messages: [
    { role: 'user', content: `Question: ${question}` },
    { role: 'assistant', content: proposedAnswer },
    { role: 'user', content: REFLECTION_PROMPT },
  ],
});
```

## Expected Performance Improvements

Based on the improving-gaia-scores.md analysis:

| Metric | Without ReAct | With ReAct | Improvement |
|--------|--------------|------------|-------------|
| Level 1 (Easy) | ~60% | ~75-80% | +15-20% |
| Level 2 (Medium) | ~40% | ~55-65% | +15-25% |
| Level 3 (Hard) | ~20% | ~35-45% | +15-25% |
| Overall Accuracy | ~40% | ~55-65% | +15-25% |

**Improvement Sources**:
1. Better task decomposition (+5-10%)
2. Systematic tool selection (+5-10%)
3. Cross-verification (+5-10%)
4. Reduced format errors (+3-5%)

## Advanced Features

### Custom Strategies

You can also use the reflection and confidence features independently:

```typescript
import { 
  createGaiaAgent,
  reflectOnAnswer,
  estimateConfidence,
  createTaskAwareInstructions,
} from '@gaia-agent/sdk';

// Create custom agent with task-aware instructions
const customInstructions = createTaskAwareInstructions(
  question,
  hasFiles
);

const agent = createGaiaAgent({
  instructions: customInstructions,
});

// Generate answer
const result = await agent.generate({ messages });

// Estimate confidence
const confidence = estimateConfidence({
  stepsCount: result.steps?.length,
  toolsUsed: extractToolNames(result.steps),
  answerLength: result.text?.length,
});

// Reflect if needed
if (confidence < 80) {
  const reflection = await reflectOnAnswer(
    agent,
    task,
    result.text,
    true
  );
  
  if (reflection.shouldRetry) {
    // Retry with different approach
  }
}
```

## Best Practices

### 1. Always Use for Benchmarks
```typescript
// ✅ GOOD - Use ReAct for benchmarks
const agent = createGaiaAgent({ useReActPlanner: true });
```

### 2. Combine with Task Detection
```typescript
// ✅ GOOD - Detect task type and adapt
const instructions = createTaskAwareInstructions(question, hasFiles);
const agent = createGaiaAgent({ instructions });
```

### 3. Use Confidence Thresholds
```typescript
// ✅ GOOD - Retry low-confidence answers
if (confidence < 70) {
  // Try alternative approach
}
```

### 4. Enable Reflection for Critical Tasks
```typescript
// ✅ GOOD - Verify before submission
const reflection = await reflectOnAnswer(agent, task, answer);
if (reflection.shouldRetry) {
  // Investigate further
}
```

## Comparison: Default vs ReAct

### Default Instructions
```
Pros:
- Simpler, more concise
- Faster execution (fewer reasoning steps)
- Good for straightforward tasks

Cons:
- Less structured reasoning
- May miss verification steps
- No task-specific guidance
```

### ReAct Planner
```
Pros:
- Structured reasoning phases
- Task-aware strategy selection
- Built-in verification
- Better multi-step handling

Cons:
- Slightly more verbose
- May take more steps
- Requires understanding of framework
```

**Recommendation**: Use ReAct for GAIA benchmarks and complex tasks. Use default for simple, straightforward questions.

## Implementation Details

### How Task Detection Works

```typescript
export function getTaskAwareInstructions(question: string, hasFiles: boolean): string {
  let additionalInstructions = "";

  // Regex pattern matching
  const isFactual = /\b(when|who|where|what year|founded|invented)\b/i.test(question);
  const isMath = /\b(calculate|compute|sum|average|multiply)\b/i.test(question);
  const isCode = /\b(code|program|script|function)\b/i.test(question);
  const isBrowser = /\b(website|webpage|url|navigate)\b/i.test(question);

  // Add pattern-specific guidance
  if (isFactual) {
    additionalInstructions += FACTUAL_GUIDANCE;
  }
  // ... etc
}
```

### How Confidence Estimation Works

```typescript
export function estimateConfidence(options): number {
  let confidence = 50; // baseline

  // Heuristics:
  // - More steps → higher confidence
  // - Search + verification → +25%
  // - Calculations verified → +10%
  // - Errors present → -30%
  // - Answer length (too short/long) → -20%/-10%

  return Math.max(0, Math.min(100, confidence));
}
```

## Testing

Test the ReAct planner:

```bash
# Run test script
pnpm tsx benchmark/test-react.ts

# Compare default vs ReAct on actual benchmark
pnpm benchmark --limit 5  # Default
# vs
# (modify benchmark to use useReActPlanner: true)
pnpm benchmark --limit 5  # ReAct
```

## Future Enhancements

Planned improvements (see docs/improving-gaia-scores.md):

1. **Adaptive Learning**: Track which strategies work best per task type
2. **Multi-Agent Voting**: Run multiple strategies and vote on answer
3. **Source Reliability Tracking**: Learn which sources are most accurate
4. **Automated Strategy Selection**: ML model to pick best strategy
5. **Continuous Improvement**: Feedback loop from benchmark results

## References

- [ReAct Paper](https://arxiv.org/abs/2210.03629) - Original ReAct framework
- [GAIA Benchmark](https://arxiv.org/abs/2311.12983) - GAIA benchmark paper
- [Improving GAIA Scores](../improving-gaia-scores.md) - Comprehensive improvement strategies
- [AI SDK Documentation](https://sdk.vercel.ai/) - AI SDK v6 docs

## Contributing

To improve the ReAct planner:

1. Analyze failed tasks to identify patterns
2. Add new task detection patterns
3. Refine tool selection heuristics
4. Improve confidence estimation algorithm
5. Add new reflection prompts

See [docs/improving-gaia-scores.md](./improving-gaia-scores.md) for comprehensive improvement strategies.
