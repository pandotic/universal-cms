---
name: subject-kb
version: "1.0.0"
description: |
  Add or update a Subject Knowledge Base for Wayka's Study Partner.
  Use when: the user provides a research doc or subject-specific teaching content
  and wants to create/update a Subject KB that powers all generation functions
  (study guides, flashcards, quizzes, games) and the chatbot for that subject.
---

# Subject Knowledge Base Skill

## What This Does

Creates or updates a Subject KB file that automatically injects subject-specific
learning science into every AI generation function and the chatbot. The system is
extensible — each KB follows the same `SubjectKB` interface and plugs into an
existing registry.

## When This Skill Applies

- User provides a research document (e.g., `docs/research/dyslexia-*-kb.md`)
- User asks to add a new subject (math, history, etc.)
- User asks to update an existing KB with new research or rules

## Architecture Context

- **Registry:** `supabase/functions/_shared/subject-kb.ts`
- **KB files:** `supabase/functions/_shared/subject-kbs/{subject}.ts`
- **Interface:** `SubjectKB` with 4 fields: `generationContext`, `chatbotRules`, `hintLadder`, `barrierModel`
- **Existing KBs:** `literature.ts`, `foreign-language.ts`, `science.ts`
- **Consumers:** extract, generate-guide, generate-flashcards, generate-quiz, generate-game, chat (all edge functions)

## Step-by-Step Process

### 1. Read the Research Document
Read the provided research doc thoroughly. Identify:
- Teaching model / pedagogical approach
- Barrier taxonomy (what types of difficulties students face)
- Vocabulary/language teaching strategies
- Content-type-specific rules (flashcard families, quiz types, game modes)
- Hint ladder progression
- Chatbot dialogue patterns
- Subject-specific operational heuristics

### 2. Create the KB File
Create `supabase/functions/_shared/subject-kbs/{subject}.ts`

Follow this exact structure:
```typescript
import type { SubjectKB } from '../subject-kb.ts'

export const {subject}KB: SubjectKB = {
  id: '{subject}',              // kebab-case
  displayName: '{Subject}',     // Human-readable
  subjects: [...],              // lowercase strings that trigger this KB

  generationContext: `...`,     // ~800 tokens max
  chatbotRules: `...`,          // ~600 tokens max
  hintLadder: `...`,            // ~200 tokens max
  barrierModel: `...`,          // ~300 tokens max
}
```

**Token budget guidelines (these are injected into LLM prompts):**
- `generationContext` (~800 tokens): Teaching model, vocabulary routine, content families (flashcards, quizzes, games), core rules. This is the densest field.
- `chatbotRules` (~600 tokens): Chatbot identity, dialogue pattern, operational heuristics, subject-specific tips, what NOT to do.
- `hintLadder` (~200 tokens): 5-level scaffold, subject-specific at each level.
- `barrierModel` (~300 tokens): Barrier taxonomy with scaffold for each barrier. CRITICAL instruction: don't treat every failure the same way.

**Optimization for LLM consumption:**
- Write as direct instructions, not prose descriptions
- Use imperative mood ("Teach X", "Never do Y", not "The system should teach X")
- Use markdown headers and bullet lists for scanability
- Include concrete examples where they clarify (e.g., "endothermic: endo=in, therm=heat")
- Put the most actionable rules first within each section
- Avoid redundancy across fields — each field has a distinct purpose
- Include a CRITICAL callout for the single most important rule in each field

### 3. Register the KB
Edit `supabase/functions/_shared/subject-kb.ts`:
1. Add import: `import { {subject}KB } from './subject-kbs/{subject}.ts'`
2. Add to `SUBJECT_KBS` array: `{subject}KB,`
3. Update the "Future" comment to remove the newly added subject

### 4. Update "How It Works" Page
Edit `src/features/architecture/learningScienceData.ts`:
1. Update `co-subjectkb` node `description` to mention the new KB's teaching approach
2. Add a `howWeImplement` line for the new KB (teaching model, barrier count, key features)
3. Update the "Future" line to remove the newly added subject

### 5. Update Learning Science Skill File
Edit `~/.claude/skills/lumi-learning-science/SKILL.md` Section 13.4:
1. Add a new `**{Subject} KB:**` block with key details
2. Add the subject's teaching method to the `**Per-KB Teaching Methods:**` section
3. Update the "Future KBs" list
4. Add new research citations if applicable

### 6. Type Check
Run `npx tsc --noEmit` — must pass clean.

### 7. Deploy
Deploy all 8 edge functions that import from `_shared/subject-kb.ts`:
```bash
for fn in extract generate-guide generate-flashcards generate-quiz generate-game chat stt tts; do
  npx supabase functions deploy $fn --project-ref hiondvpttypfhhilyvtw --no-verify-jwt
done
```

## Subjects Array Guidelines

The `subjects` array should include:
- The canonical subject name (e.g., 'biology')
- Common variations (e.g., 'ap biology', 'life science')
- Related sub-disciplines (e.g., 'ecology', 'anatomy')
- All lowercase
- The registry uses `subjectLower.includes(s)` — so 'biology' matches 'ap biology honors' automatically

## Quality Checklist

Before finalizing a KB, verify:
- [ ] generationContext covers: teaching model, vocabulary approach, flashcard families, quiz types, game modes, core rules
- [ ] chatbotRules covers: identity, dialogue pattern, heuristics, subject-specific tips, anti-patterns
- [ ] hintLadder has 5 levels with subject-appropriate examples at each level
- [ ] barrierModel covers all barrier types from the research doc, each with a scaffold
- [ ] barrierModel includes CRITICAL instruction about not treating all failures the same
- [ ] Token budgets respected (~800, ~600, ~200, ~300)
- [ ] No redundancy across fields
- [ ] Concrete examples included where they add clarity
- [ ] Research sources documented in the file header comment
- [ ] Type check passes
