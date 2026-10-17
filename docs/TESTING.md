# Testing (test-first for logic)

Tools: Vitest + React Testing Library (jsdom). CI runs `npm test` on every push.

## Scope
Test-first: search and typo matching, bridging-link lookup, quiz scoring, flashcard logic,
saved-concept storage, data validation, import script. Pure layout is exempt.

## The loop
1. I describe the behavior.
2. The AI writes a failing test.
3. I review it and watch it fail.
4. The AI implements until it is green.
5. Small commit.

## Anti-cheating rules
- Never edit or delete an existing test to make it pass without asking me.
- Never hardcode the expected value in the implementation.
- Never use `.skip`, `.only`, or loosen an assertion to get green.
- Never mock the unit under test.
- Show the failing output before implementing. One failing test at a time.
- Tests check behavior, not implementation details.
