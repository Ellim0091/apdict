import type { Catalog, Question } from './types';
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length-1; i > 0; i--) { const j = Math.floor(Math.max(0, Math.min(0.999999999, random())) * (i+1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
export type QuizItem = Omit<Question, 'answerIndex' | 'explanation'>;
export function createQuiz(catalog: Catalog, options: { entryIds?: string[]; count?: number; random?: () => number } = {}): QuizItem[] {
  const questions = catalog.quiz.filter(q => !options.entryIds || options.entryIds.includes(q.entryId));
  return shuffle(questions, options.random).slice(0, Math.max(0, Math.floor(options.count ?? 10))).map(q => ({ id: q.id, entryId: q.entryId, prompt: q.prompt, choices: [...q.choices], reviewed: q.reviewed }));
}
export function gradeAnswer(catalog: Catalog, questionId: string, choice: number) {
  const q = catalog.quiz.find(q => q.id === questionId);
  if (!q) throw new Error('Unknown question');
  if (!Number.isInteger(choice) || choice < 0 || choice >= q.choices.length) throw new Error('Invalid answer');
  return { correct: q.answerIndex === choice, correctIndex: q.answerIndex, explanation: q.explanation };
}
export function scoreQuiz(catalog: Catalog, questionIds: string[], answers: Record<string, number>) {
  const ids = [...new Set(questionIds)];
  const results = ids.map(id => {
    const q = catalog.quiz.find(q => q.id === id);
    if (!q) throw new Error('Unknown question');
    const choice = answers[id];
    return { questionId: id, answered: choice !== undefined, ...(choice === undefined ? { correct: false, correctIndex: q.answerIndex, explanation: q.explanation } : gradeAnswer(catalog, id, choice)) };
  });
  const correct = results.filter(r => r.correct).length;
  return { total: ids.length, correct, answered: results.filter(r => r.answered).length, percent: ids.length ? Math.round(correct / ids.length * 100) : 0, results };
}
export interface CardProgress { intervalDays: number; dueAt: number; repetitions: number }
export function reviewCard(previous: CardProgress | undefined, rating: 'again' | 'hard' | 'good' | 'easy', now = Date.now()): CardProgress {
  const days = previous?.intervalDays ?? 0;
  const intervalDays = rating === 'again' ? 0 : rating === 'hard' ? Math.max(1, days * 1.2) : rating === 'good' ? Math.max(1, days * 2) : Math.max(4, days * 3);
  return { intervalDays, dueAt: now + (rating === 'again' ? 60000 : intervalDays * 86400000), repetitions: (previous?.repetitions ?? 0) + 1 };
}
export function getFlashcards(catalog: Catalog, progress: Record<string, CardProgress>, options: { entryIds?: string[]; now?: number; dueOnly?: boolean } = {}) {
  const now = options.now ?? Date.now();
  return catalog.entries.filter(e => (!options.entryIds || options.entryIds.includes(e.id)) && (!options.dueOnly || !progress[e.id] || progress[e.id].dueAt <= now)).sort((a,b) => (progress[a.id]?.dueAt ?? 0) - (progress[b.id]?.dueAt ?? 0)).map(e => ({ id: e.id, front: e.term, back: e.definition, keyFact: e.keyFact }));
}
