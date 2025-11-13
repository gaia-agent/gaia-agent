# Option 4: Reflection - Implementation Guide

**Status**: Not yet implemented (implementation guide for future development)

---

## 🤔 What is Reflection?

Reflection adds an **explicit reasoning step** after each tool execution where the agent:
1. Analyzes what it just learned
2. Evaluates if it's on the right track
3. Decides what to do next
4. Adjusts strategy if needed

---

## 🎯 Concept

### Current Flow (ReAct)

```
THOUGHT → ACTION → OBSERVATION → [next action]
```

### With Reflection

```
THOUGHT → ACTION → OBSERVATION → REFLECTION → [next action]
```

### Reflection Questions

After each tool execution, the agent reflects:
- **What did I learn?** - Summarize new information
- **Does this help?** - Is this moving me toward the answer?
- **Confidence level?** - How certain am I about this information?
- **Next step?** - Should I continue this approach or try something else?
- **Alternative approaches?** - Are there better ways to solve this?

---

## 💡 Implementation Approaches

### Approach A: Prompt-Based Reflection (Simpler)

Inject reflection prompts between tool calls:

```typescript
// In evaluator.ts or agent wrapper
async function executeWithReflection(task: GaiaTask, agent: GAIAAgent) {
  const messages: CoreMessage[] = buildPromptMessages(task);
  let stepCount = 0;
  let reflections: string[] = [];
  
  while (stepCount < 15) {
    // Execute one step
    const result = await agent.generate({ messages });
    
    // If tool was used, inject reflection prompt
    if (result.steps && result.steps[result.steps.length - 1]?.toolCalls) {
      messages.push({
        role: 'assistant',
        content: result.text,
      });
      
      // Inject reflection prompt
      messages.push({
        role: 'user',
        content: `🤔 REFLECTION:
        
Before your next action, reflect on what you just learned:

1. What did the tool return?
2. Does this information help answer the question?
3. How confident are you in this information? (low/medium/high)
4. What should you do next?
   - If you have the answer → Use verifier, then provide final answer
   - If you need more info → Which tool should you use next?
   - If uncertain → Should you verify with a different source?

Provide your reflection, then decide your next action.`
      });
      
      // Get reflection + next action
      const reflection = await agent.generate({ messages });
      reflections.push(reflection.text);
      
      // Check if task complete
      if (reflection.text.toLowerCase().includes('final answer') ||
          reflection.text.toLowerCase().includes('task complete')) {
        break;
      }
    }
    
    stepCount++;
  }
  
  return {
    answer: extractFinalAnswer(result.text),
    reflections,
    steps: stepCount,
  };
}
```

**Pros:**
- ✅ Simple to implement
- ✅ Works with existing agent
- ✅ No architecture changes
- ✅ Reflections visible in logs

**Cons:**
- ⚠️ Doubles token usage (extra LLM call per step)
- ⚠️ Slows execution (2x time)
- ⚠️ May exceed max steps limit faster

---

### Approach B: Reflection Tool (Structured)

Create a dedicated reflection tool:

```typescript
// src/tools/planning/reflection.ts
export const reflectionTool = tool({
  description: `Reflect on your progress after using a tool.
  
  Use this tool AFTER each tool execution to:
  - Summarize what you learned
  - Assess if you're on track
  - Plan next steps
  `,
  
  inputSchema: z.object({
    toolUsed: z.string().describe("Which tool did you just use?"),
    resultSummary: z.string().describe("What did the tool return?"),
    helpful: z.boolean().describe("Did this help answer the question?"),
    confidence: z.enum(['low', 'medium', 'high']).describe("Confidence in this information"),
    nextAction: z.string().describe("What will you do next?"),
    reasoning: z.string().describe("Why is this the right next step?"),
  }),
  
  execute: async ({
    toolUsed,
    resultSummary,
    helpful,
    confidence,
    nextAction,
    reasoning
  }) => {
    // Log reflection for analysis
    console.log(`\n💭 REFLECTION after ${toolUsed}:`);
    console.log(`   Result: ${resultSummary}`);
    console.log(`   Helpful: ${helpful ? 'Yes' : 'No'}`);
    console.log(`   Confidence: ${confidence}`);
    console.log(`   Next: ${nextAction}`);
    console.log(`   Why: ${reasoning}\n`);
    
    // Store reflection in memory if available
    if (global.agent?.memoryStore) {
      await global.agent.memoryStore({
        memory: `Reflection after ${toolUsed}: ${resultSummary}. Confidence: ${confidence}. Next: ${nextAction}`
      });
    }
    
    return {
      success: true,
      shouldContinue: !nextAction.includes('final answer'),
      recommendation: nextAction,
    };
  },
});
```

**Enhanced Instructions:**
```typescript
export const REFLECTION_INSTRUCTIONS = `
After EVERY tool execution:
1. Use reflectionTool to analyze what you learned
2. Assess confidence and plan next step
3. Continue based on reflection recommendation

Example flow:
- search for information
- reflectionTool: "Search returned X. Confidence: high. Next: verify with calculator"
- calculator for verification
- reflectionTool: "Calculation confirms X. Confidence: high. Next: use verifier"
- verifier confirms answer
- Provide final answer
`;
```

**Pros:**
- ✅ Structured data collection
- ✅ Trackable in benchmark results
- ✅ Can analyze reflection patterns
- ✅ Store in memory for later retrieval

**Cons:**
- ⚠️ Agent must learn to use reflection tool
- ⚠️ Adds +1 step per tool call
- ⚠️ May not always be called (instruction-dependent)

---

### Approach C: Built-in Reflection Layer (Advanced)

Modify agent architecture to add reflection between steps:

```typescript
// src/agent-with-reflection.ts
export class ReflectiveGAIAAgent extends GAIAAgent {
  async generate(options: { messages?: CoreMessage[]; prompt?: string }) {
    const messages = options.messages || [
      { role: 'user', content: options.prompt || '' }
    ];
    
    let currentStep = 0;
    const maxSteps = 15;
    const reflections: Reflection[] = [];
    
    while (currentStep < maxSteps) {
      // Execute one step
      const stepResult = await super.generate({ messages });
      
      // If tool was used, trigger reflection
      if (stepResult.steps && stepResult.steps.length > 0) {
        const lastStep = stepResult.steps[stepResult.steps.length - 1];
        
        if ('toolCalls' in lastStep && lastStep.toolCalls?.length > 0) {
          // Automatic reflection
          const reflection = await this.reflect({
            step: lastStep,
            messages,
            currentAnswer: stepResult.text,
          });
          
          reflections.push(reflection);
          
          // Decide whether to continue
          if (reflection.shouldStop) {
            break;
          }
          
          // Add reflection to messages
          messages.push({
            role: 'assistant',
            content: stepResult.text,
          });
          
          messages.push({
            role: 'user',
            content: this.buildReflectionPrompt(reflection),
          });
        }
      }
      
      currentStep++;
    }
    
    return {
      ...stepResult,
      reflections,
    };
  }
  
  private async reflect(context: ReflectionContext): Promise<Reflection> {
    // Analyze step results
    // Determine confidence
    // Plan next action
    // Return structured reflection
  }
}
```

**Pros:**
- ✅ Most powerful - full control
- ✅ Can implement advanced patterns
- ✅ Can auto-adjust strategy
- ✅ Built-in learning from reflections

**Cons:**
- ⚠️ High complexity
- ⚠️ Requires architectural changes
- ⚠️ Breaking changes to API
- ⚠️ Harder to maintain

---

## 📊 When to Use Reflection

### High Value Scenarios

Reflection is most valuable for:
- **Level 3 tasks** - Complex multi-step reasoning
- **Uncertain results** - When tool returns ambiguous data
- **Strategy pivots** - When first approach isn't working
- **Multi-source verification** - Comparing contradictory sources

### Lower Value Scenarios

Reflection may be overkill for:
- **Level 1 tasks** - Simple factual lookups
- **Single-step tasks** - Direct calculations
- **High-confidence results** - Clear, authoritative answers

---

## 🎯 Recommended Approach

**For your use case, I recommend Approach A (Prompt-Based Reflection):**

### Why?

1. **Easiest to implement** - No new tools, just prompt injection
2. **Works with existing architecture** - No breaking changes
3. **Immediate testing** - Can try today with benchmark
4. **Flexible** - Easy to iterate and refine prompts
5. **Complements ReAct + Planning** - Natural extension

### Implementation Steps

1. Create `src/benchmark/reflection-evaluator.ts`
2. Copy `evaluator.ts` and modify to inject reflection prompts
3. Add `--reflect` flag to benchmark runner
4. Test on Level 2-3 tasks
5. Compare accuracy improvement
6. Refine reflection prompts based on results

---

## 🧪 Testing Strategy

### Phase 1: Baseline (Already Done)

```bash
# Current performance with ReAct + Planning
pnpm benchmark --level 2 --limit 20 > baseline-level2.txt
pnpm benchmark --level 3 --limit 10 > baseline-level3.txt
```

### Phase 2: Add Reflection

```bash
# Test with reflection enabled
pnpm benchmark --level 2 --limit 20 --reflect > reflection-level2.txt
pnpm benchmark --level 3 --limit 10 --reflect > reflection-level3.txt
```

### Phase 3: Compare

```typescript
// Analyze results
const baselineAccuracy = calculateAccuracy('baseline-level2.txt');
const reflectionAccuracy = calculateAccuracy('reflection-level2.txt');
const improvement = reflectionAccuracy - baselineAccuracy;

console.log(`Improvement: +${improvement}%`);
```

---

## 💡 Reflection Prompt Templates

### Template 1: Basic Reflection

```typescript
const BASIC_REFLECTION = `
🤔 Pause and reflect:

1. What did you just learn from the tool?
2. Does this move you closer to the answer?
3. Confidence level? (low/medium/high)
4. What's your next action?

Think step-by-step, then decide.
`;
```

### Template 2: Detailed Reflection

```typescript
const DETAILED_REFLECTION = `
🤔 REFLECTION CHECKPOINT:

What you just did:
- Tool used: [last tool]
- Result summary: [what did it return?]

Analyze:
□ Is this information reliable? Why/why not?
□ Does it directly answer the question?
□ Are there inconsistencies or contradictions?
□ Do you need to verify with another source?

Confidence Assessment:
□ Low (<60%): Try different approach or additional source
□ Medium (60-80%): Verify with one more source
□ High (>80%): Proceed to verifier, then answer

Next Action:
[What will you do next and why?]
`;
```

### Template 3: Strategy Pivot

```typescript
const PIVOT_REFLECTION = `
🤔 Strategy Check:

Original plan: [what was your initial approach?]
Current status: [where are you now?]

Questions:
1. Is your current approach working?
   - If YES: Continue to next step
   - If NO: What alternative approach should you try?

2. Have you hit a dead end?
   - If YES: What's a completely different strategy?
   - If NO: Keep going

3. Time check: You've used [X] steps of 15
   - Enough time? Continue current path
   - Running low? Simplify approach

Decision: [Continue current path OR Try alternative approach]
`;
```

---

## 📈 Expected Impact

With reflection added to ReAct + Planning:

| Task Level | ReAct + Planning | + Reflection | Improvement |
|------------|------------------|--------------|-------------|
| Level 1 | ~70% | ~72% | +2% (minimal) |
| Level 2 | ~55% | ~65% | +10% (significant) |
| Level 3 | ~35% | ~45% | +10% (significant) |
| Overall | ~50-55% | ~58-63% | +8% |

**Why smaller improvement on Level 1?**
- Simple tasks don't benefit much from reflection
- Overhead may actually slow down simple lookups
- Reflection most valuable for complex reasoning

---

## 🚧 Implementation Checklist

When you're ready to implement:

- [ ] Choose approach (A, B, or C)
- [ ] Create reflection prompts
- [ ] Add `--reflect` flag to benchmark
- [ ] Test on 5-10 tasks manually
- [ ] Run full benchmark comparison
- [ ] Analyze token usage increase
- [ ] Measure time overhead
- [ ] Refine prompts based on results
- [ ] Document successful reflection patterns
- [ ] Add to main documentation

---

## 🎓 Learning from Reflections

### Track Successful Patterns

```typescript
interface ReflectionPattern {
  scenario: string;
  reflectionText: string;
  nextAction: string;
  wasSuccessful: boolean;
}

// Example successful patterns:
const successfulPatterns = [
  {
    scenario: "Search returned conflicting years",
    reflection: "Two sources say 2003, one says 2004. Majority consensus + official source = 2003",
    nextAction: "Use verifier to confirm, then answer",
    wasSuccessful: true,
  },
  {
    scenario: "Calculation seems too high",
    reflection: "Result 15000 seems wrong. Recalculate with different method",
    nextAction: "Use sandbox to verify calculation",
    wasSuccessful: true,
  }
];
```

### Anti-Patterns to Avoid

```typescript
// ❌ Reflection without action
"I'm not sure if this is correct" → [then does nothing]

// ❌ Circular reflection
"Should I search or calculate?" → "Let me think..." → [repeats]

// ❌ Over-reflection paralysis
Spends 5 steps reflecting, runs out of steps before answering

// ✅ Good reflection
"Medium confidence. Will verify with one more source, then answer"
```

---

## 📚 Additional Resources

- **ReAct Paper**: [Reason+Act: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629)
- **Self-Reflection in LLMs**: [Reflexion: Language Agents with Verbal Reinforcement Learning](https://arxiv.org/abs/2303.11366)
- **Chain-of-Thought**: [Chain-of-Thought Prompting Elicits Reasoning](https://arxiv.org/abs/2201.11903)

---

## 🤝 Next Steps

After reviewing this guide:

1. **Decide on approach** - A (prompts) vs B (tool) vs C (architecture)
2. **Implement minimal version** - Start simple
3. **Test on small sample** - 5-10 tasks
4. **Measure impact** - Accuracy + token usage + time
5. **Iterate based on results** - Refine prompts
6. **Scale to full benchmark** - If promising results

**Want to proceed?** Let me know which approach you prefer, and I'll implement it!

---

**Questions?** 
- Check `docs/react-planning.md` for ReAct + Planning docs
- See `docs/improving-gaia-scores.md` for full optimization guide
