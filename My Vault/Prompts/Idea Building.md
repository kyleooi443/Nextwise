---
tags:
  - prompts
  - ideas
status: seed
---
> [!info] Works with
> [[Prompt Framework + Pitch Deck]]: build the idea here, then turn it into slides there.

## Idea canvas

| Step | Question to answer |
| --- | --- |
| **1. Spark** | What is the idea in one sentence? |
| **2. Problem** | What problem does it solve, and how do you know it's real? |
| **3. Persona** | Who has this problem? Be specific (role, age, daily routine) |
| **4. Solution** | How does your idea fix it? |
| **5. UVP** | Why would they pick this over what they use now? |
| **6. Features** | What are the 3 must-have features? |
| **7. Risks** | What could make it fail? What are you assuming? |
| **8. Validation** | How can you test it cheaply this week? |
| **9. MVP** | What is the smallest version you can build? |
| **10. Next steps** | What are the next three actions? |

> [!tip] Test the problem before the solution
> If you can't name a real person who has the problem, go back to step 2.

## Is it worth building?
- [ ] The problem is real and happens often
- [ ] A specific group of people would use it
- [ ] It is clearly different from what exists
- [ ] I can build a basic version with my current skills and time
- [ ] I can explain it in one sentence

## Prompt: build my idea
```text
Context: I'm a [role]. My idea is [one sentence]. It's for [who],
in [where], because [why]. I plan to [how].
Input: Help me develop this idea step by step: problem, persona,
solution, UVP, features, risks, validation, MVP.
Goal: [e.g., a clear concept I can pitch at a hackathon]
Think step by step. Challenge weak assumptions and point out risks honestly.
Acceptance criteria:
- [ ] Problem is specific and backed by evidence
- [ ] Persona is a narrow, real group
- [ ] UVP fits in one sentence
- [ ] MVP can be built in [timeframe]
- [ ] Risks and the next 3 actions are listed
```