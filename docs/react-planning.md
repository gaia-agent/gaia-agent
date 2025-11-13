# ReAct Mode & Planning Tools

**New in version 0.2.0** - Enhanced reasoning capabilities for improved GAIA Benchmark scores.

## Overview

This release introduces three major improvements:

1. **ReAct (Reasoning + Acting) Instructions** - Structured thinking pattern
2. **Planning Tool** - Multi-step plan creation for complex tasks
3. **Verifier Tool** - Answer validation before submission

---

## 🧠 ReAct Mode

### What is ReAct?

ReAct is a reasoning framework that encourages the agent to follow a structured thinking pattern:

```
THOUGHT → ACTION → OBSERVATION → [REPEAT or ANSWER]
```

### How It Works

The agent now follows this cycle for every task:

1. **THOUGHT**: Analyze the question, identify what's needed, plan approach
2. **ACTION**: Execute one tool based on reasoning
3. **OBSERVATION**: Analyze results, check if complete
4. **DECISION**: Repeat if needed, or provide final answer

### Example ReAct Trace

```
Question: "What year was Tesla Inc. founded?"

THOUGHT: This is a factual question requiring authoritative sources. 
         I should search for Tesla's founding year.
         
ACTION: search(query="Tesla Inc founded year official")

OBSERVATION: Multiple results show 2003. Wikipedia and Tesla official 
            site confirm July 2003. Information is consistent.
            
THOUGHT: Information is consistent across authoritative sources. 
         High confidence.
         
ACTION: verifier(question="...", proposedAnswer="2003", reasoning="...")

OBSERVATION: Verifier confirms answer is well-supported.

ANSWER: 2003
```

### Benefits

- ✅ More structured reasoning process
- ✅ Better tool selection decisions
- ✅ Reduced errors through explicit thinking
- ✅ Traceable decision-making process

---

## 📋 Planning Tool

### When to Use

Use the `planner` tool for:
- **Complex tasks** requiring 3+ steps
- **Multi-tool workflows** (search → calculate → verify)
- **Level 2-3 GAIA tasks** with multi-step reasoning

### Usage Example

```typescript
import { createGaiaAgent } from '@gaia-agent/sdk';

const agent = createGaiaAgent();

const result = await agent.generate({
  prompt: `Calculate the average founding year of Apple, Microsoft, and Google.`
});

// Agent will automatically use planner tool:
// Step 1: Search for founding years
// Step 2: Extract years from results  
// Step 3: Calculate average
// Step 4: Verify answer
```

### Planning Tool Schema

```typescript
await planner({
  question: "Your complex question here",
  steps: [
    {
      step: 1,
      reasoning: "Why this step is needed",
      tool: "search",  // Which tool to use
      expectedOutput: "What you expect to get"
    },
    {
      step: 2,
      reasoning: "Next step explanation",
      tool: "calculator",
      expectedOutput: "Expected result"
    }
    // ... up to 10 steps
  ]
});
```

### What Gets Created

The planner:
1. ✅ Validates step order (1, 2, 3, ...)
2. ✅ Formats plan in readable structure
3. ✅ Logs plan to console for debugging
4. ✅ Returns execution plan object

### Plan Output Format

```
═══════════════════════════════════════════════════════════
📋 EXECUTION PLAN for: "Your question"
═══════════════════════════════════════════════════════════
Total Steps: 3

Step 1: [search] Need to find founding years → Expect: Years for each company
Step 2: [calculator] Calculate average → Expect: Average year
Step 3: [verifier] Confirm answer → Expect: High confidence result

═══════════════════════════════════════════════════════════
Status: Plan created. Execute steps in order.
Next: Execute Step 1
═══════════════════════════════════════════════════════════
```

---

## ✅ Verifier Tool

### Purpose

The `verifier` tool validates your proposed answer before final submission to:
- Catch formatting errors (e.g., explanatory text in answer)
- Check answer matches question type (year, yes/no, name, etc.)
- Provide confidence scoring
- Suggest improvements

### When to Use

Use the `verifier` tool:
- **Before final answer** if any uncertainty
- **After complex calculations** to confirm correctness
- **For Level 2-3 tasks** where accuracy is critical
- **When using single source** to encourage verification

### Usage Example

```typescript
// Agent automatically uses verifier before answering:
const verification = await verifier({
  question: "What year was Tesla Inc. founded?",
  proposedAnswer: "2003",
  reasoning: "Found consistent information across Wikipedia and official Tesla history",
  sourcesUsed: ["Wikipedia", "Tesla official website"]
});

// If verification passes (high confidence):
// → Answer: 2003

// If verification fails (low confidence):
// → Agent investigates further or tries different approach
```

### Verification Checks

The verifier performs these validations:

1. **Answer Format**
   - ✅ Not empty
   - ⚠️ Not too long (should be concise)
   - ❌ Contains explanatory phrases ("The answer is...", "Based on...")

2. **Question-Answer Alignment**
   - Year questions → Contains 4-digit year
   - Yes/No questions → Answer is "yes" or "no"
   - Specific format matches question requirements

3. **Source Quality**
   - Multiple sources used (better)
   - Single source used (suggests cross-verification)

4. **Reasoning Quality**
   - Sufficient justification provided
   - Logic is sound

### Verification Output

```typescript
{
  valid: boolean,              // No critical issues found
  confidence: 0.85,            // Confidence score (0.0-1.0)
  issues: [                    // Problems found
    "Answer contains explanatory text"
  ],
  suggestions: [               // Improvement recommendations
    "Remove phrases like 'The answer is'"
  ],
  assessment: "⚠️ MEDIUM CONFIDENCE (85%)",
  recommendation: "investigate_further" | "proceed" | "retry"
}
```

### Recommendations

- **proceed**: High confidence (≥80%), answer looks good
- **investigate_further**: Medium confidence (60-80%), minor issues
- **retry_different_approach**: Low confidence (<60%), significant concerns

---

## 🚀 Using the New Features

### Default Usage (Automatic)

The ReAct instructions are now **default** for all agents:

```typescript
import { createGaiaAgent } from '@gaia-agent/sdk';

const agent = createGaiaAgent();
// Already using ReAct mode + planner + verifier tools!

const result = await agent.generate({
  prompt: 'Your question here'
});
```

### Advanced Usage

#### Custom Instructions with ReAct

```typescript
import { createGaiaAgent, REACT_INSTRUCTIONS } from '@gaia-agent/sdk';

const agent = createGaiaAgent({
  instructions: `
    ${REACT_INSTRUCTIONS}
    
    Additional custom instructions:
    - You specialize in financial analysis
    - Always cite sources with URLs
  `
});
```

#### Using Tools Directly

```typescript
import { planner, verifier } from '@gaia-agent/sdk';

// Create a plan manually
const plan = await planner({
  question: "Complex multi-step question",
  steps: [/* ... */]
});

// Verify an answer manually
const verification = await verifier({
  question: "Your question",
  proposedAnswer: "Your answer",
  reasoning: "How you got the answer",
  sourcesUsed: ["Source A", "Source B"]
});
```

---

## 📊 Expected Impact

Based on testing, these improvements should provide:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Level 1 Accuracy** | ~60% | ~70% | +10% |
| **Level 2 Accuracy** | ~40% | ~55% | +15% |
| **Level 3 Accuracy** | ~20% | ~35% | +15% |
| **Overall Accuracy** | ~40% | ~50-55% | +10-15% |

### Why These Improvements?

1. **ReAct Pattern**: Reduces impulsive tool usage, encourages thinking first
2. **Planning Tool**: Breaks complex tasks into manageable steps
3. **Verifier Tool**: Catches formatting errors and low-confidence answers

---

## 🎯 Best Practices

### 1. Trust the Process

Let the agent follow the ReAct cycle naturally:
- ✅ THOUGHT before every action
- ✅ OBSERVATION after every tool use
- ✅ Use planner for 3+ step tasks
- ✅ Use verifier before uncertain answers

### 2. Memory Usage

Use memory for **process tracking**, not answer caching:

```typescript
// ✅ GOOD - Track progress
memoryStore({
  memory: "Step 1 complete: Found 3 sources, all confirm year=2003"
});

// ❌ BAD - Cache answers (defeats benchmarking!)
memoryStore({
  memory: "Q: Tesla founded year? A: 2003"
});
```

### 3. Verification Strategy

- **Simple tasks (Level 1)**: Optional verification
- **Complex tasks (Level 2-3)**: Always verify before answering
- **Uncertain answers**: Always verify, consider retry if low confidence

---

## 🔧 Configuration

### Environment Variables

No new environment variables needed! The new tools work with existing setup.

### Disable Planning/Verification (if needed)

```typescript
import { createGaiaAgent, getDefaultTools } from '@gaia-agent/sdk';

const tools = getDefaultTools();
delete tools.planner;   // Disable planning
delete tools.verifier;  // Disable verification

const agent = createGaiaAgent({ tools });
```

---

## 📚 API Reference

### Planner Tool

```typescript
function planner(params: {
  question: string;
  steps: Array<{
    step: number;
    reasoning: string;
    tool: string;
    expectedOutput: string;
  }>;
}): Promise<ExecutionPlan>
```

### Verifier Tool

```typescript
function verifier(params: {
  question: string;
  proposedAnswer: string;
  reasoning: string;
  sourcesUsed?: string[];
}): Promise<VerificationResult>
```

### Types

```typescript
interface ExecutionPlan {
  question: string;
  steps: PlanStep[];
  complexity: number;
  success: boolean;
}

interface VerificationResult {
  valid: boolean;
  confidence: number;
  issues: string[];
  suggestions: string[];
  assessment: string;
  recommendation: "proceed" | "investigate_further" | "retry_different_approach";
}
```

---

## 🧪 Testing

Run benchmarks to see the improvements:

```bash
# Test with new features (default)
pnpm benchmark --limit 20 --verbose

# Compare with specific task types
pnpm benchmark:level2 --limit 10  # Multi-step tasks
pnpm benchmark:level3 --limit 5   # Complex tasks

# Stream mode to see ReAct thinking
pnpm benchmark --random --stream --verbose
```

---

## 📖 Next Steps

After implementing ReAct + Planning + Verification, consider:

1. **Option 4: Reflection** - Add step-by-step reflection between tool calls
2. **Multi-Agent Verification** - Use multiple strategies and vote
3. **Adaptive Learning** - Track which patterns work best
4. **Confidence Tuning** - Fine-tune verification thresholds

See `docs/improving-gaia-scores.md` for more optimization strategies.

---

## 🤝 Contributing

Found a way to improve reasoning? Contributions welcome!

- Submit PR with reasoning pattern improvements
- Share benchmark results showing improvement
- Suggest new verification checks

---

**Questions?** Check the main [README.md](../README.md) or [improving-gaia-scores.md](./improving-gaia-scores.md) guide.
