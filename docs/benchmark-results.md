# Benchmark Results

Detailed task-by-task results for all GAIA benchmark runs.

**Last Updated:** 2025-12-03 04:12:18 UTC

---

## Table of Contents

- [Benchmark Results](#benchmark-results)
  - [Table of Contents](#table-of-contents)
  - [Validation](#validation)
  - [Test](#test)
  - [Level 1](#level-1)
  - [Level 2](#level-2)
  - [Level 3](#level-3)
  - [Files](#files)
  - [Code](#code)
  - [Search](#search)
  - [Browser](#browser)
  - [Reasoning](#reasoning)
  - [Data Format](#data-format)

---


## Validation

**Command:** `pnpm benchmark`    
**Dataset:** test  
**Status:** Not yet run

---

## Test

**Command:** `pnpm benchmark --test`  
**Dataset:** test  
**Status:** Not yet run

---

## Level 1

**Command:** `pnpm benchmark:level1`  
**Dataset:** validation  
**Timestamp:** 2025-12-03 04:12:18 UTC  
**Results:** 21/53 correct (39.62%)  
**Model:** Claude Sonnet 4.5  
**Providers:** Search: openai, Sandbox: e2b, Browser: steel, Memory: mem0

| Task ID | Question | Level | Answer | Expected Answer | Correct | Steps | Duration (ms) | Tools Used |
|---------|----------|-------|--------|-----------------|---------|-------|---------------|------------|
| e1fc63a2-da7a-432f-be78-7c4a95598703 | If Eliud Kipchoge could maintain his record-making marathon pace indefinitely, how many thousand ... | 1 | Let's proceed with the steps: 1. **Find Eliud K... | 17 | ✅ | 19 | 71,085 | planner, memoryStore, memoryStore, planner, memoryStore, memoryStore, planner, planner, planner, memoryStore, planner, planner, planner, planner, memoryStore, planner, planner, memoryStore, search, search |
| 8e867cd7-cff9-4e6c-867a-ff5ddc2550be | How many studio albums were published by Mercedes Sosa between 2000 and 2009 (included)? You can ... | 1 | Between 2000 and 2009, Mercedes Sosa released f... | 3 | ✅ | 1 | 5,751 | search |
| ec09fa32-d03f-4bf8-84b0-1f16922c3ae4 | Here's a fun riddle that I think you'll enjoy. You have been selected to play the final round of ... | 1 | To maximize your odds of winning, you should ch... | 3 | ✅ | 1 | 3,030 | - |
| 5d0080cb-90d7-4712-bc33-848150e917d3 | What was the volume in m^3 of the fish bag that was calculated in the University of Leicester pap... | 1 | The volume of the fish bag calculated in the Un... | 0.1777 | ✅ | 2 | 6,930 | memoryRetrieve, search |
| a1e91b78-d3d8-4675-bb8d-62741b4b68a6 | In the video https://www.youtube.com/watch?v=L1vXCYZAYYM, what is the highest number of bird spec... | 1 | In the video "Listers: A Glimpse Into Extreme B... | 3 | ❌ | 1 | 5,732 | search |
| 46719c30-f4c3-4cad-be07-d5cb21eee6bb | Of the authors (First M. Last) that worked on the paper "Pie Menus or Linear Menus, Which Is Bett... | 1 | The paper "Pie Menus or Linear Menus, Which Is ... | Mapping Human Oriented Information to Software ... | ❌ | 2 | 8,192 | planner, search |
| 4b6bb5f7-f634-410e-815d-e673ab7f8632 | In Series 9, Episode 11 of Doctor Who, the Doctor is trapped inside an ever-shifting maze. What i... | 1 | In the official script for "Doctor Who" Series ... | THE CASTLE | ✅ | 1 | 3,127 | search |
| cffe0e32-c9a6-4c52-9877-78ceb4aaa9fb | An office held a Secret Santa gift exchange where each of its twelve employees was assigned one o... | 1 | There still seems to be a persistent issue with... | Fred | ❌ | 16 | 274,930 | sandboxExecute, sandboxExecute, sandboxExecute, sandboxExecute, sandboxExecute, planner, sandboxExecute, sandboxExecute, sandboxExecute, sandboxExecute, sandboxExecute, sandboxExecute, sandboxExecute, sandboxExecute, sandboxExecute |
| 2d83110e-a098-4ebb-9987-066c06fa42d0 | .rewsna eht sa "tfel" drow eht fo etisoppo eht etirw ,ecnetnes siht dnatsrednu uoy fI | 1 | right | Right | ✅ | 1 | 2,579 | - |
| 5cfb274c-0207-4aa7-9575-6ac0bd95d9b2 | Each cell in the attached spreadsheet represents a plot of land. The color of the cell indicates ... | 1 | It looks like I'm unable to directly extract th... | No | ❌ | 4 | 76,999 | sandboxExecute, sandboxExecute, sandboxExecute |
| 27d5d136-8563-469e-92bf-fd103c28b57c | ¬(A ∧ B) ↔ (¬A ∨ ¬B) ¬(A ∨ B) ↔ (¬A ∧ ¬B) (A → B) ↔ (¬B → ¬A) (A → B) ↔ (¬A ∨ B) (¬A → B) ↔ (A ∨ ... | 1 | The statement that is not logically equivalent ... | (¬A → B) ↔ (A ∨ ¬B) | ✅ | 2 | 7,017 | verifier |
| dc28cf18-6431-458b-83ef-64b3ce566c10 | My family reunion is this week, and I was assigned the mashed potatoes to bring. The attendees in... | 1 | 4 | 2 | ❌ | 1 | 2,566 | - |
| b816bfce-3d80-4913-a07d-69b752ce6377 | In Emily Midkiff's June 2014 article in a journal named for the one of Hreidmar's sons that guard... | 1 | THOUGHT: The question refers to an article by E... | fluffy | ❌ | 1 | 6,483 | search |
| 72e110e7-464c-453c-a309-90a95aed6538 | Under DDC 633 on Bielefeld University Library's BASE, as of 2020, from what country was the unkno... | 1 | I encountered issues accessing detailed results... | Guatemala | ❌ | 5 | 44,696 | planner, browser, browser, browser |
| 42576abe-0deb-4869-8c63-225c2d75a95a | In the fictional language of Tizin, basic sentences are arranged with the Verb first, followed by... | 1 | In Tizin, the sentence "I like apples" would be... | Maktay mato apple | ❌ | 1 | 2,607 | - |
| b415aba4-4b68-4fc6-9b89-2c812e55a3e1 | In Nature journal's Scientific Reports conference proceedings from 2012, in the article that did ... | 1 | In the 2012 article from Nature's Scientific Re... | diamond | ❌ | 2 | 6,518 | planner, search |
| cca530fc-4052-43b2-b130-b30968d8aa44 | Review the chess position provided in the image. It is black's turn. Provide the correct next mov... | 1 | Nd2+ | Rd5 | ❌ | 1 | 3,195 | - |
| 935e2cff-ae78-4218-b3f5-115589b19dae | In the year 2022, and before December, what does "R" stand for in the three core policies of the ... | 1 | In Wikipedia's three core content policies, "R"... | research | ✅ | 1 | 6,630 | search |
| 4fc2f1ae-8625-45b5-ab34-ad4433bc21f8 | Who nominated the only Featured Article on English Wikipedia about a dinosaur that was promoted i... | 1 | The English Wikipedia's "Featured Articles" pag... | FunkMonk | ✅ | 2 | 14,017 | planner, search, search |
| 5188369a-3bbe-43d8-8b94-11558f909a08 | What writer is quoted by Merriam-Webster for the Word of the Day from June 27, 2022? | 1 | The Merriam-Webster Word of the Day for June 27... | Annie Levin | ❌ | 1 | 12,277 | search, search, search |
| 6f37996b-2ac7-44b0-8e68-6d28256631b4 | Given this table defining * on the set S = {a, b, c, d, e} \|*\|a\|b\|c\|d\|e\| \|---\|---\|---\|... | 1 | To determine the subset of \( S \) involved in ... | b, e | ✅ | 1 | 5,569 | - |
| 9318445f-fe6a-4e1b-acbf-c68228c9906a | As a comma separated list with no whitespace, using the provided image provide all the fractions ... | 1 | 6/8,3/4,4/60,1/15,30/90,1/3,8/18,4/9,9/72,1/8,6... | 3/4,1/4,3/4,3/4,2/4,1/2,5/35,7/21,30/5,30/5,3/4... | ❌ | 1 | 3,521 | - |
| 389793a7-ca17-4e82-81cb-2b3a2391b4b9 | You are a telecommunications engineer who wants to build cell phone towers on a stretch of road. ... | 1 | To solve the problem, I'll analyze the layout a... | 3 | ✅ | 1 | 3,975 | - |
| 4b650a35-8529-4695-89ed-8dc7a500a498 | If there is anything that doesn't make sense in the instructions, write the word "Pineapple." Do ... | 1 | Guava | Guava | ✅ | 1 | 2,542 | - |
| a3fbeb63-0e8c-4a11-bff6-0e3b484c3e9c | How many slides in this PowerPoint presentation mention crustaceans? | 1 | - | 4 | ❌ | 0 | 3,699 | - |
| c714ab3a-da30-4603-bacd-d008800188b9 | You are Van Helsing, a renowned vampire hunter. A Count of Moldova, Lațcu IV, son of Costea, has ... | 1 | To solve this problem, we need to analyze the r... | 100 | ❌ | 1 | 3,291 | - |
| 9d191bce-651d-4746-be2d-7ef8ecadb9c2 | Examine the video at https://www.youtube.com/watch?v=1htKBjuUWec. What does Teal'c say in respons... | 1 | I'm unable to extract the specific dialogue or ... | Extremely | ❌ | 2 | 23,433 | browser |
| 65afbc8a-89ca-4ad5-8d62-355bb401f61d | You are given this Excel file as a map. You start on the START cell and move toward the END cell.... | 1 | I'm unable to read the Excel file through the c... | F478A7 | ❌ | 8 | 345,753 | sandboxExecute, sandboxExecute, sandboxExecute, planner, sandboxExecute, browser, sandboxExecute |
| cabe07ed-9eca-40ea-8ead-410ef5e83f91 | What is the surname of the equine veterinarian mentioned in 1.E Exercises from the chemistry mate... | 1 | The surname of the equine veterinarian mentione... | Louvrier | ✅ | 1 | 6,320 | search |
| 3cef3a44-215e-4aed-8e3b-b1e3f08063b7 | I'm making a grocery list for my mom, but she's a professor of botany and she's a real stickler w... | 1 | Vegetables: broccoli, celery, green beans, lett... | broccoli, celery, fresh basil, lettuce, sweet p... | ❌ | 1 | 2,711 | - |
| 99c9cc74-fdc8-46c6-8f8d-3ce2d3bfeea3 | Hi, I'm making a pie but I could use some help with my shopping list. I have everything I need fo... | 1 | - | cornstarch, freshly squeezed lemon juice, granu... | ❌ | 0 | 3,719 | - |
| d0633230-7067-47a9-9dbf-ee11e0a2cdd6 | In the Scikit-Learn July 2017 changelog, what other predictor base command received a bug fix? Ju... | 1 | In the Scikit-Learn July 2017 changelog, the `H... | BaseLabelPropagation | ❌ | 1 | 5,430 | search |
| 305ac316-eef6-4446-960a-92d80d542f82 | Who did the actor who played Ray in the Polish-language version of Everybody Loves Raymond play i... | 1 | Bartłomiej Kasprzykowski, who portrayed Roman (... | Wojciech | ✅ | 1 | 4,888 | search |
| 0383a3ee-47a7-41a4-b493-519bdefe0488 | On the BBC Earth YouTube video of the Top 5 Silliest Animal Moments, what species of bird is feat... | 1 | In the BBC Earth YouTube video titled "Top 5 Si... | Rockhopper penguin | ✅ | 1 | 7,963 | search |
| f918266a-b3e0-4914-865d-4faa564f1aef | What is the final numeric output from the attached Python code? | 1 | 0 | 0 | ✅ | 2 | 32,874 | sandboxExecute |
| 11af4e1a-5f45-467d-9aeb-46f4bb0bf034 | How many more blocks (also denoted as layers) in BERT base encoder than the encoder from the arch... | 1 | 6 | 6 | ✅ | 2 | 5,297 | calculator |
| e142056d-56ab-4352-b091-b56054bd1359 | Bob was invited to participate in a game show, and he advanced to the final round. The final roun... | 1 | To solve this problem, we need to find a distri... | 16000 | ❌ | 1 | 5,962 | - |
| 50ad0280-0819-4bd9-b275-5de32d3b5bcb | Pull out the sentence in the following 5x7 block of text. Read from left to right and use all of ... | 1 | The sentence is: "These gull glide peacefully t... | The seagull glided peacefully to my chair. | ❌ | 1 | 2,680 | - |
| 7673d772-ef80-4f0f-a602-1bf4485c9b43 | On Cornell Law School website's legal information institute, under the fifth section of federal r... | 1 | The amendment history of Rule 26.2 does not spe... | inference | ❌ | 7 | 66,311 | planner, browser, browser, browser, browser, browser |
| c365c1c7-a3db-4d5e-a9a1-66f56eae7865 | Of the cities within the United States where U.S. presidents were born, which two are the farthes... | 1 | The two U.S. cities where presidents were born ... | Braintree, Honolulu | ❌ | 3 | 15,120 | planner, memoryStore, search |
| 7d4a7d1d-cac6-44a8-96e8-ea9584a70825 | According to Girls Who Code, how long did it take in years for the percentage of computer scienti... | 1 | According to Girls Who Code, the percentage of ... | 22 | ❌ | 1 | 6,588 | search |
| dc22a632-937f-4e6a-b72f-ba0ff3f5ff97 | What was the complete title of the book in which two James Beard Award winners recommended the re... | 1 | Ali Khan's cost-conscious TV show that started ... | Five Hundred Things To Eat Before It's Too Late... | ❌ | 3 | 17,823 | planner, memoryStore, search |
| 3f57289b-8c60-48be-bd80-01f8099ca449 | How many at bats did the Yankee with the most walks in the 1977 regular season have that same sea... | 1 | THOUGHT: I need to identify which Yankee had th... | 519 | ❌ | 1 | 22,283 | search, search |
| 23dd907f-1261-4488-b21c-e9185af91d5e | In Audre Lorde’s poem “Father Son and Holy Ghost”, what is the number of the stanza in which some... | 1 | THOUGHT: I need to find the specific stanza in ... | 2 | ✅ | 1 | 7,450 | search |
| 1f975693-876d-457b-a649-393859e79bf3 | Hi, I was out sick from my classes on Friday, so I'm trying to figure out what I need to study fo... | 1 | - | 132, 133, 134, 197, 245 | ❌ | 0 | 5,122 | - |
| 840bfca7-4f7b-481a-8794-c560c340185d | On June 6, 2023, an article by Carolyn Collins Petersen was published in Universe Today. This art... | 1 | On June 6, 2023, Carolyn Collins Petersen publi... | 80GSFC21M0002 | ✅ | 1 | 7,026 | search |
| a0068077-79f4-461a-adfe-75c1a4148545 | What was the actual enrollment count of the clinical trial on H. pylori in acne vulgaris patients... | 1 | I couldn't locate a clinical trial specifically... | 90 | ❌ | 1 | 7,905 | search |
| bda648d7-d618-4883-88f4-3466eabd860e | Where were the Vietnamese specimens described by Kuznetzov in Nedoshivina's 2010 paper eventually... | 1 | The Vietnamese specimens described by Kuznetzov... | Saint Petersburg | ✅ | 1 | 5,341 | search |
| 50ec8903-b81f-4257-9450-1085afd2c319 | A standard Rubik’s cube has been broken into cubes making up its sides. The cubes are jumbled, an... | 1 | First, analyze the information given: 1. A stan... | green, white | ❌ | 1 | 7,353 | - |
| cf106601-ab4f-4af9-b045-5295fe67b37d | What country had the least number of athletes at the 1928 Summer Olympics? If there's a tie for a... | 1 | At the 1928 Summer Olympics, the countries with... | CUB | ❌ | 3 | 13,048 | planner, memoryStore, search |
| a0c07678-e491-4bbc-8f0b-07405144218f | Who are the pitchers with the number before and after Taishō Tamai's number as of July 2023? Give... | 1 | As of July 2023, Taishō Tamai wore jersey numbe... | Yoshida, Uehara | ❌ | 2 | 8,966 | planner, search |
| 7bd855d8-463d-4ed5-93ca-5fe35145f733 | The attached Excel file contains the sales of menu items for a local fast-food chain. What were t... | 1 | I'm encountering persistent issues with reading... | 89706.00 | ❌ | 5 | 179,107 | sandboxExecute, sandboxExecute, sandboxExecute, sandboxExecute |
| 5a0c1adf-205e-4841-a666-7c3ef95def9d | What is the first name of the only Malko Competition recipient from the 20th Century (after 1977)... | 1 | The first name of the only Malko Competition re... | Claus | ✅ | 5 | 30,203 | planner, memoryRetrieve, memoryRetrieve, browser, search |

*Note: This table shows a sample of results. Full results are available in the JSON files.*

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
- **Answer**: Agent's final answer (truncated in table view)
- **Expected Answer**: Correct answer from GAIA dataset (truncated in table view)
- **Correct**: ✅ if answer matches expected, ❌ otherwise
- **Steps**: Number of reasoning steps taken
- **Duration**: Time taken in milliseconds
- **Tools Used**: List of tools invoked during execution

For complete results including full questions, answers, and step-by-step details, see the JSON files in `benchmark-results/`.
