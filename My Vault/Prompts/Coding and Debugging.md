---
tags:
  - prompts
  - coding
---
> [!tip] Always include the error message
> Paste the exact error text, your code, and what you expected to happen. A vague bug report gets a vague answer.

## Bug report checklist
- [ ] Language, framework, and version
- [ ] What I expected
- [ ] What actually happened
- [ ] The exact error message
- [ ] The code (only the relevant part)
- [ ] What I already tried

## Prompt: fix a bug
```text
Context: I'm using [language/framework]. I expected [expected result],
but got [actual result].
Input: Error message: [paste]. Code: [paste]. Already tried: [list].
Goal: Fix the bug and help me understand the cause.
Think step by step: find the root cause first, then fix it.
Acceptance criteria:
- [ ] Shows the exact line or logic that causes the bug
- [ ] Gives the corrected code, not just a description
- [ ] Explains why the fix works in beginner-friendly words
- [ ] Mentions how to avoid this bug next time
```

## Prompt: explain this code
```text
Explain this code line by line for a beginner: [paste code].
Say what each part does, what the output will be, and give one
small example input and output.
```

## Prompt: review my code
```text
Review this code: [paste]. List the top 5 issues by severity
(bugs, readability, security, performance). For each, give one
concrete fix with the improved code.
```

## Prompt: build a feature
```text
Context: My project uses [stack]. Feature: [one sentence].
Goal: [what the user can do when it works]
Think step by step: plan the files and functions first, then write the code.
Acceptance criteria:
- [ ] Works with my current stack, no new libraries unless needed
- [ ] Handles empty input and errors
- [ ] Includes how to run and test it
- [ ] Code has short comments for tricky parts
```