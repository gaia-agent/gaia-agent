# Benchmark Results

Detailed task-by-task results for all GAIA benchmark runs.

**Last Updated:** 2025-11-26 08:33:44 UTC

---

## Table of Contents

- [Validation Set (All Tasks)](#validation)
- [Test Set (All Tasks)](#test)
- [Level 1 Tasks](#level-1)
- [Level 2 Tasks](#level-2)
- [Level 3 Tasks](#level-3)
- [File Handling Tasks](#files)
- [Code Execution Tasks](#code)
- [Search Tasks](#search)
- [Browser Automation Tasks](#browser)
- [Reasoning Tasks](#reasoning)

---

## Validation

**Command:** `pnpm benchmark`  
**Dataset:** validation  
**Timestamp:** 2025-11-26 08:33:44 UTC  
**Results:** 22/53 correct (41.51%)  
**Model:** gpt-4o  
**Providers:** Search: tavily, Sandbox: e2b, Browser: steel

| Task ID | Question | Level | Correct | Steps | Duration (ms) | Tools Used |
|---------|----------|-------|---------|-------|---------------|------------|
| e1fc63a2-da7a-432f-be78-7c4a95598703 | If Eliud Kipchoge could maintain his record-making marathon pace indefinitely, how many thousand hours would it take him to run the distance between the Earth and the Moon its closest approach? Please use the minimum perigee value on the Wikipedia page for the Moon when carrying out your calculation. Round your result to the nearest 1000 hours and do not use any comma separators if necessary. | 1 | ✅ | 5 | 31,434 | calculator, httpRequest, search |
| 8e867cd7-cff9-4e6c-867a-ff5ddc2550be | How many studio albums were published by Mercedes Sosa between 2000 and 2009 (included)? You can use the latest 2022 version of english wikipedia. | 1 | ✅ | 1 | 9,167 | search |
| ec09fa32-d03f-4bf8-84b0-1f16922c3ae4 | Here's a fun riddle that I think you'll enjoy. You have been selected to play the final round of the hit new game show "Pick That Ping-Pong". In this round, you will be competing for a large cash prize. Your job will be to pick one of several different numbered ping-pong balls, and then the game will commence... | 1 | ✅ | 1 | 8,249 | - |
| 5d0080cb-90d7-4712-bc33-848150e917d3 | What was the volume in m^3 of the fish bag that was calculated in the University of Leicester paper "Can Hiccup Supply Enough Fish to Maintain a Dragon's Diet?" | 1 | ✅ | 1 | 9,264 | search |
| a1e91b78-d3d8-4675-bb8d-62741b4b68a6 | In the video https://www.youtube.com/watch?v=L1vXCYZAYYM, what is the highest number of bird species to be on camera simultaneously? | 1 | ❌ | 1 | 2,862 | - |
| 46719c30-f4c3-4cad-be07-d5cb21eee6bb | Of the authors (First M. Last) that worked on the paper "Pie Menus or Linear Menus, Which Is Better?" in 2015, what was the title of the first paper authored by the one that had authored prior papers? | 1 | ❌ | 7 | 64,440 | search, calculator, httpRequest, planner, verifier |

*Note: This table shows a sample of results. Full results are available in the JSON files.*

---

## Test

**Command:** `pnpm benchmark --test`  
**Dataset:** test  
**Status:** Not yet run

---

## Level 1

**Command:** `pnpm benchmark:level1`  
**Filter:** Level 1 tasks only  
**Status:** Not yet run

---

## Level 2

**Command:** `pnpm benchmark:level2`  
**Filter:** Level 2 tasks only  
**Status:** Not yet run

---

## Level 3

**Command:** `pnpm benchmark:level3`  
**Filter:** Level 3 tasks only  
**Status:** Not yet run

---

## Files

**Command:** `pnpm benchmark:files`  
**Filter:** Tasks with file attachments  
**Status:** Not yet run

---

## Code

**Command:** `pnpm benchmark:code`  
**Filter:** Code execution and mathematical calculation tasks  
**Status:** Not yet run

---

## Search

**Command:** `pnpm benchmark:search`  
**Filter:** Web search and information retrieval tasks  
**Status:** Not yet run

---

## Browser

**Command:** `pnpm benchmark:browser`  
**Filter:** Browser automation tasks  
**Status:** Not yet run

---

## Reasoning

**Command:** `pnpm benchmark:reasoning`  
**Filter:** Pure reasoning and logic tasks  
**Status:** Not yet run

---

## Data Format

Each benchmark result includes:

- **Task ID**: Unique identifier for the task
- **Question**: The task question (truncated in table view)
- **Level**: Difficulty level (1-3)
- **Correct**: ✅ if answer matches expected, ❌ otherwise
- **Steps**: Number of reasoning steps taken
- **Duration**: Time taken in milliseconds
- **Tools Used**: List of tools invoked during execution
- **Answer**: Agent's final answer
- **Expected Answer**: Correct answer from GAIA dataset

For complete results including full questions, answers, and step-by-step details, see the JSON files in `benchmark-results/`.
