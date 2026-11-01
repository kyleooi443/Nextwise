---
tags:
  - prompts
  - pitch-deck
---
# Prompt Framework + Pitch Deck

### Key term: UVP

**Unique Value Proposition (UVP):** the one clear reason a customer picks your solution over the alternatives.
Comes from Business Strategy, Marketing, and Entrepreneurship.

### Prompt framework

| Part | What to write |
| --- | --- |
| **Context** | 5 W's and H: Who, What, When, Where, Why, How |
| **Input** | What you actually want, in detail |
| **Goals** | What you want to achieve |
| **Step-by-step reasoning** | Ask the AI to think it through in order (chain of thought) |
| **Acceptance criteria** | How you'll know the answer is good (**most important**) |

> [!tip] Acceptance criteria come first
> Write them as a checklist the answer must pass before you accept it.

### Template
```text
Context: [who / what / when / where / why / how]
Input: [exactly what I want, in detail]
Goal: [what I want to achieve]
Think step by step before answering.
Acceptance criteria:
- [ ] ...
- [ ] ...
- [ ] ...
```

## Pitch deck

### Slide order
1. **Cover**: name, tagline, team
2. **Persona**: who has the problem
3. **Problem Statement**: what they struggle with
4. **Solution**: your answer to it
5. **Features**: what it does
6. **UVP**: why it beats the alternatives
7. **Use Case Scenario**: a real situation walked through
8. **Target Market**: who you serve and how big it is
9. **SDG**: which UN goals it supports
10. **Close**: recap, ask, contact

### Prompt snippet
```text
Create a pitch deck outline with these slides: Persona, Problem Statement,
Solution, Features, UVP, Use Case Scenario, SDG, Close (include Target Market).
Sort out the proper order for these slides.
```