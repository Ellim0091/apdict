import { reviewCard, type CardProgress } from './study';
export interface StudyState { version: 1; savedIds: string[]; cards: Record<string, CardProgress>; quizHistory: { correct: number; total: number; completedAt: number }[] }
export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void }
const KEY = 'nucleus:study:v1';
const empty = (): StudyState => ({version: 1, savedIds: [], cards: {}, quizHistory: []});
const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0;
export function loadStudy(storage?: StorageLike): StudyState {
  try {
    const value = storage?.getItem(KEY);
    if (!value) return empty();
    const data = JSON.parse(value);
    if (data.version !== 1) return empty();
    const result = empty();
    result.savedIds = Array.isArray(data.savedIds) ? [...new Set<string>(data.savedIds.filter((id: unknown) => typeof id === 'string'))] : [];
    if (data.cards && typeof data.cards === 'object') for (const [id, card] of Object.entries(data.cards)) {
      const c = card as CardProgress | null;
      if (c && finite(c.intervalDays) && finite(c.dueAt) && finite(c.repetitions)) Object.defineProperty(result.cards, id, { value: c, enumerable: true, configurable: true, writable: true });
    }
    result.quizHistory = Array.isArray(data.quizHistory) ? data.quizHistory.filter((q: StudyState['quizHistory'][number]) => q && finite(q.correct) && finite(q.total) && q.correct <= q.total && finite(q.completedAt)).slice(-100) : [];
    return result;
  } catch { return empty(); }
}
export function saveStudy(state: StudyState, storage?: StorageLike): boolean {
  try { if (!storage) return false; storage.setItem(KEY, JSON.stringify(state)); return true; } catch { return false; }
}
export function toggleSaved(state: StudyState, id: string): StudyState {
  return { ...state, savedIds: state.savedIds.includes(id) ? state.savedIds.filter(s => s !== id) : [...state.savedIds, id] };
}
export function recordReview(state: StudyState, id: string, rating: Parameters<typeof reviewCard>[1], now = Date.now()): StudyState {
  return {...state, cards: {...state.cards, [id]: reviewCard(Object.hasOwn(state.cards, id) ? state.cards[id] : undefined, rating, now)}};
}
export function recordQuiz(state: StudyState, correct: number, total: number, now = Date.now()): StudyState {
  if (!Number.isInteger(correct) || !Number.isInteger(total) || correct < 0 || total < 1 || correct > total) throw new Error('Invalid quiz score');
  return {...state, quizHistory: [...state.quizHistory, {correct, total, completedAt: now}].slice(-100)};
}
// Pass window.localStorage from a client event/effect; importing these modules is SSR-safe.
