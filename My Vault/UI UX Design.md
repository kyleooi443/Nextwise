---
tags:
  - prompts
  - uiux
  - design
status: seed
---
> [!info] Works with
> [[Idea Building]] comes first. Once the idea is clear, design it here.
> [[Prompt Framework + Pitch Deck]] covers the prompt structure and the deck.

## UX process

| Stage | What you do | Output |
| --- | --- | --- |
| **1. Research** | Talk to or observe real users | Pain points |
| **2. Define** | Pick the one problem to solve | Problem statement |
| **3. Flow** | Map the steps from start to goal | User flow |
| **4. Wireframe** | Sketch layout only, no colors | Low-fi screens |
| **5. UI design** | Add color, type, spacing, components | Hi-fi screens |
| **6. Prototype** | Link screens into a clickable flow | Prototype |
| **7. Test** | Watch 3 to 5 users try it | Fixes list |

> [!tip] Design the flow before the screens
> If the steps from start to goal aren't clear, no amount of styling will fix it.

## UI foundations
- **Hierarchy:** the most important thing is the biggest or boldest
- **One primary action** per screen
- **Spacing:** use a consistent scale (4, 8, 16, 24, 32)
- **Typography:** max 2 typefaces, 3 to 4 sizes
- **Color:** one brand color, one accent, neutrals; never use color alone to carry meaning
- **Consistency:** same component, same look, same behavior everywhere

## Screen states to design
- [ ] Default
- [ ] Loading
- [ ] Empty (no data yet)
- [ ] Error
- [ ] Success

## Before handoff
- [ ] Text contrast is at least 4.5:1
- [ ] Tap targets are at least 44px
- [ ] Works at small and large screen sizes
- [ ] Every button and input has a clear label
- [ ] Every screen has a way back or out
- [ ] Components are named and reusable

## Prompt: design my UI
```text
Context: I'm designing [app/website] for [persona] who needs to
[goal] on [mobile/web]. Problem: [one sentence]. UVP: [one sentence].
Input: Design the [screen/flow]. Include the layout, components,
text, and the states for each screen.
Goal: [e.g., a clickable prototype for a hackathon demo]
Think step by step: user flow first, then wireframe, then visual style.
Acceptance criteria:
- [ ] One clear primary action per screen
- [ ] Flow takes no more than [3] steps to the goal
- [ ] Includes loading, empty, and error states
- [ ] Text contrast at least 4.5:1, tap targets at least 44px
- [ ] Uses a consistent spacing scale and max 2 typefaces
- [ ] Explains the reasoning behind each major design choice
```

## Prompt: critique my design
```text
Review this screen as a UX reviewer: [paste description or attach image].
List the top 5 problems in order of severity, say why each hurts the user,
and give one concrete fix for each.
```