/**
 * Verifier Tool - Validates answers before final submission
 *
 * Use this tool to verify your proposed answer's quality, reasoning, and confidence
 * before providing the final answer to the user. Helps catch errors and improve accuracy.
 */

import { tool } from "ai";
import { z } from "zod";

/**
 * Verification result
 */
export interface VerificationResult {
  /** Whether the answer appears to be correct */
  valid: boolean;
  /** Confidence level (0.0 - 1.0) */
  confidence: number;
  /** Issues found (if any) */
  issues: string[];
  /** Suggestions for improvement */
  suggestions: string[];
  /** Overall assessment */
  assessment: string;
  /** Whether to proceed with this answer or investigate further */
  recommendation: "proceed" | "investigate_further" | "retry_different_approach";
}

/**
 * Verifier tool - validates proposed answers
 *
 * @example
 * ```typescript
 * // Before providing final answer
 * const verification = await verifier({
 *   question: "What year was Tesla Inc. founded?",
 *   proposedAnswer: "2003",
 *   reasoning: "Found consistent information across Wikipedia and official Tesla history that company was founded in July 2003",
 *   sourcesUsed: ["Wikipedia", "Tesla official website", "Business news archives"]
 * });
 *
 * if (verification.recommendation === "proceed") {
 *   // Answer: 2003
 * } else {
 *   // Investigate further or try different approach
 * }
 * ```
 */
export const verifier = tool({
  description: `Verify your proposed answer before final submission to catch errors and improve confidence.

USE THIS TOOL when:
- You have a proposed answer but want to verify it's correct
- You're uncertain about answer quality or accuracy
- You want to check reasoning before submitting
- You want to ensure answer format matches the question

The verifier will analyze your answer, reasoning, and sources to provide confidence assessment.`,

  inputSchema: z.object({
    question: z.string().describe("The original question you're answering"),
    proposedAnswer: z.string().describe("Your proposed final answer (concise format)"),
    reasoning: z
      .string()
      .describe(
        "Your reasoning process: How did you arrive at this answer? What tools did you use?",
      ),
    sourcesUsed: z
      .array(z.string())
      .optional()
      .describe("List of sources/tools used (e.g., ['Wikipedia', 'search', 'calculator'])"),
  }),

  execute: async ({
    question,
    proposedAnswer,
    reasoning,
    sourcesUsed = [],
  }): Promise<VerificationResult> => {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let confidence = 0.8; // Start with moderate confidence

    // Check 1: Answer format validation
    const answerLength = proposedAnswer.trim().length;
    if (answerLength === 0) {
      issues.push("Proposed answer is empty");
      confidence -= 0.5;
    } else if (answerLength > 100) {
      issues.push(
        "Answer is very long - GAIA expects concise answers (should be < 50 chars typically)",
      );
      suggestions.push("Extract just the key answer (year, name, number) without explanation");
      confidence -= 0.2;
    }

    // Check 2: Reasoning validation
    if (reasoning.length < 20) {
      issues.push("Reasoning is too brief - insufficient justification");
      confidence -= 0.3;
    }

    // Check 3: Sources validation
    if (sourcesUsed.length === 0) {
      suggestions.push("No sources listed - consider documenting which tools/sources you used");
      confidence -= 0.1;
    } else if (sourcesUsed.length === 1) {
      suggestions.push("Only one source used - consider cross-verifying with additional source");
      confidence -= 0.05;
    } else {
      // Multiple sources is good!
      confidence += 0.1;
    }

    // Check 4: Question-answer alignment
    const questionLower = question.toLowerCase();
    const answerLower = proposedAnswer.toLowerCase();

    // Check for year questions
    if (
      questionLower.includes("year") ||
      questionLower.includes("when") ||
      questionLower.includes("founded")
    ) {
      const hasYear = /\b(19|20)\d{2}\b/.test(answerLower);
      if (!hasYear) {
        issues.push("Question asks for a year, but answer doesn't contain a 4-digit year");
        confidence -= 0.3;
      } else {
        confidence += 0.05;
      }
    }

    // Check for yes/no questions
    if (
      questionLower.includes("is it") ||
      questionLower.includes("does it") ||
      questionLower.includes("(yes/no)")
    ) {
      const isYesNo =
        answerLower === "yes" ||
        answerLower === "no" ||
        answerLower === "true" ||
        answerLower === "false";
      if (!isYesNo) {
        issues.push("Question expects yes/no answer, but answer is not yes/no");
        confidence -= 0.2;
      } else {
        confidence += 0.05;
      }
    }

    // Check 5: Explanatory text in answer (should be removed)
    const hasExplanatoryPhrases =
      answerLower.includes("the answer is") ||
      answerLower.includes("based on") ||
      answerLower.includes("according to") ||
      answerLower.includes("because") ||
      answerLower.includes("after");

    if (hasExplanatoryPhrases) {
      issues.push("Answer contains explanatory text - should be concise answer only");
      suggestions.push('Remove phrases like "The answer is", "Based on", "According to"');
      confidence -= 0.15;
    }

    // Ensure confidence is in valid range
    confidence = Math.max(0.0, Math.min(1.0, confidence));

    // Determine recommendation
    let recommendation: VerificationResult["recommendation"];
    if (issues.length === 0 && confidence >= 0.8) {
      recommendation = "proceed";
    } else if (issues.length > 0 && confidence < 0.5) {
      recommendation = "retry_different_approach";
    } else {
      recommendation = "investigate_further";
    }

    // Generate assessment
    let assessment: string;
    if (confidence >= 0.8) {
      assessment = `✅ HIGH CONFIDENCE (${Math.round(confidence * 100)}%) - Answer appears solid. ${issues.length === 0 ? "No issues found." : `Minor issues: ${issues.length}`}`;
    } else if (confidence >= 0.6) {
      assessment = `⚠️ MEDIUM CONFIDENCE (${Math.round(confidence * 100)}%) - Answer may be correct but has ${issues.length} issue(s). Consider verification.`;
    } else {
      assessment = `❌ LOW CONFIDENCE (${Math.round(confidence * 100)}%) - Significant concerns found. Recommend investigation or retry.`;
    }

    const result: VerificationResult = {
      valid: issues.length === 0,
      confidence,
      issues,
      suggestions,
      assessment,
      recommendation,
    };

    // Log verification result for debugging
    console.log("\n🔍 Verification Result:");
    console.log(`   ${assessment}`);
    if (issues.length > 0) {
      console.log(`   Issues: ${issues.join("; ")}`);
    }
    if (suggestions.length > 0) {
      console.log(`   Suggestions: ${suggestions.join("; ")}`);
    }
    console.log(`   Recommendation: ${recommendation}\n`);

    return result;
  },
});

/**
 * Schema for verifier tool (for use in tool collections)
 */
export const verifierSchema = z.object({
  question: z.string().describe("The original question you're answering"),
  proposedAnswer: z.string().describe("Your proposed final answer (concise format)"),
  reasoning: z.string().describe("Your reasoning process and how you arrived at this answer"),
  sourcesUsed: z.array(z.string()).optional().describe("List of sources/tools used"),
});
