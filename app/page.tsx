"use client";

import { useEffect, useMemo, useState } from "react";
import { getCatalog, getDraftCatalog, getEntry, searchEntries } from "@/lib/catalog";
import { createQuiz, getFlashcards, gradeAnswer, scoreQuiz, type QuizItem } from "@/lib/study";
import { toggleSaved, recordReview, recordQuiz } from "@/lib/storage";
import { useStudy } from "@/lib/use-study";
import type { Course, Entry } from "@/lib/types";

type View = "home" | "term" | "saved" | "flashcards" | "quiz";
const published = getCatalog();
const drafts = getDraftCatalog();
function Icon({ name }: { name: "search" | "bookmark" | "arrow" | "back" | "cards" | "close" }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    bookmark: <path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-3.7L6 21Z" />,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    back: <path d="m15 18-6-6 6-6" />,
    cards: <><rect x="5" y="3" width="15" height="17" rx="2" /><path d="M9 8h7M9 12h5M3 7v12a2 2 0 0 0 2 2h11" /></>,
    close: <path d="m7 7 10 10M17 7 7 17" />,
  };
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}


export default function Home() {
  const [view, setView] = useState<View>("home");
  const [preview, setPreview] = useState(false);
  const catalog = preview ? drafts : published;
  const [query, setQuery] = useState("");
  const [course, setCourse] = useState<Course | "">("");
  const [selectedId, setSelectedId] = useState("");
  const selected = getEntry(catalog, selectedId);
  const { study, setStudy, ready, storageError } = useStudy();
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [dueOnly, setDueOnly] = useState(false);
  const [quiz, setQuiz] = useState<QuizItem[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [complete, setComplete] = useState(false);
  const [quizScope, setQuizScope] = useState<"all" | "saved">("all");
  const [now, setNow] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const suggestions = useMemo(() => searchEntries(catalog, query, {course: course || undefined}), [catalog, query, course]);
  const savedTerms = catalog.entries.filter(e => study.savedIds.includes(e.id));
  const cards = getFlashcards(catalog, study.cards, {entryIds: savedTerms.map(e => e.id), dueOnly, now});
  const currentCard = cards.length ? cards[flashcardIndex % cards.length] : undefined;
  const question = quiz[quizIndex];
  const choice = question ? answers[question.id] : undefined;
  const feedback = question && choice !== undefined ? gradeAnswer(catalog, question.id, choice) : undefined;
  const score = complete ? scoreQuiz(catalog, quiz.map(q => q.id), answers) : undefined;

  function navigate(next: View) { setView(next); window.scrollTo({top: 0, behavior: "smooth"}); }
  function openTerm(entry: Entry) { setSelectedId(entry.id); navigate("term"); }
  function save(id: string) { if (ready) setStudy(s => toggleSaved(s, id)); }
  function startCards() { setNow(Date.now()); setFlashcardIndex(0); setFlipped(false); navigate("flashcards"); }
  function startQuiz() {
    setQuiz(createQuiz(catalog, {count: 8, entryIds: quizScope === "saved" ? savedTerms.map(e => e.id) : undefined}));
    setQuizIndex(0); setAnswers({}); setComplete(false);
  }
  function nextQuestion() {
    if (quizIndex + 1 < quiz.length) setQuizIndex(i => i + 1);
    else {
      const result = scoreQuiz(catalog, quiz.map(q => q.id), answers);
      setStudy(s => recordQuiz(s, result.correct, result.total)); setComplete(true);
    }
  }
  function changePreview() {
    setPreview(p => !p); setQuiz([]); setComplete(false); setSelectedId(""); navigate("home");
  }
  const brand = <button className="mark" aria-label="Nucleus home" onClick={() => navigate("home")}><span>N</span>Nucleus</button>;
  function termRow(entry: Entry, index: number) {
    return <button key={entry.id} onClick={() => openTerm(entry)} className="suggestion">
      <span className={`term-index ${entry.course === "ap-chem" ? "chemistry" : "biology"}`}>{String(index+1).padStart(2,"0")}</span>
      <span className="suggestion-main"><small>{entry.category}</small><strong>{entry.term}</strong><span>{entry.summary}</span></span>
      <span className="term-formula">{entry.keyFact}</span><span className="round-arrow"><Icon name="arrow" /></span>
    </button>;
  }
  return <div className="app">
    <header className="header">{brand}<nav aria-label="Main navigation">
      <button className={view === "home" ? "active" : ""} onClick={() => navigate("home")}>Search</button>
      <button className={view === "saved" ? "active" : ""} onClick={() => navigate("saved")}><Icon name="bookmark" /> Saved <span className="count">{savedTerms.length}</span></button>
      <button className={view === "flashcards" ? "active" : ""} onClick={startCards}><Icon name="cards" /> Flashcards</button>
      <button className={view === "quiz" ? "active" : ""} onClick={() => navigate("quiz")}>Quiz</button>
    </nav></header>
    <div className="preview-banner"><span>{preview ? "Draft preview · Content and questions await accuracy and AP review." : "The library is being curated. Explore the design with 16 draft concepts."}</span><button onClick={changePreview}>{preview ? "Exit preview" : "Preview draft library"} <span aria-hidden="true">↗</span></button></div>
    {storageError && <p className="storage-warning" role="status">Browser storage is unavailable. Changes work for this visit but may not survive a reload.</p>}
    {view === "home" && <main className="home">
      <section className="search-hero"><div className="hero-grid" /><div className="hero-text">
        <span className="overline">Biology + Chemistry</span><h1>Understand science,<br /><em>one term at a time.</em></h1>
        <p>Search clear, connected explanations for the concepts you meet in class.</p>
        <div className="search-box"><Icon name="search" /><input aria-label="Search concepts" value={query} onChange={e => setQuery(e.target.value)} placeholder="Try “enzime” or “covalent bond”" />{query && <button aria-label="Clear search" onClick={() => setQuery("")}><Icon name="close" /></button>}</div>
        <div className="hint">Typo-friendly search · Follow your curiosity</div>
      </div></section>
      <section className="results"><div className="results-heading"><div><span>{query ? "Search the library" : "Start exploring"}</span><h2>{query ? `Results for “${query}”` : "Connected concepts"}</h2></div><p>{catalog.entries.length} concepts in the {preview ? "draft " : ""}library</p></div>
        <div className="filters" aria-label="Filter by subject">{[["", "All concepts"],["ap-bio","AP Biology"],["ap-chem","AP Chemistry"]].map(([value,label]) => <button key={value} aria-pressed={course === value} className={course === value ? "active" : ""} onClick={() => setCourse(value as Course | "")}>{label}</button>)}</div>
        <div className="suggestion-list">{suggestions.map(termRow)}</div>
        {!suggestions.length && <div className="empty-saved"><h2>{catalog.entries.length ? "No matching concepts" : "A little science is on its way."}</h2><p>{catalog.entries.length ? "Try another word, an abbreviation, or a different subject." : "The first concepts are drafted and awaiting review. You can explore them in preview mode."}</p><button onClick={() => { if (!catalog.entries.length && !preview) changePreview(); else {setQuery("");setCourse("");} }}>{catalog.entries.length ? "Clear filters" : "Explore draft concepts"} <Icon name="arrow" /></button></div>}
      </section>
    </main>}
    {view === "term" && selected && <main className="term-page">
      <button className="back-link" onClick={() => navigate("home")}><Icon name="back" /> Back to search</button>
      <section className="term-hero"><div className="term-heading"><span className="overline">{selected.course === "both" ? "Biology + Chemistry" : selected.course === "ap-chem" ? "Chemistry" : "Biology"} / {selected.category}</span><h1>{selected.term}</h1><p>{selected.summary}</p><button disabled={!ready} className={study.savedIds.includes(selected.id) ? "save-button saved" : "save-button"} onClick={() => save(selected.id)}><Icon name="bookmark" />{study.savedIds.includes(selected.id) ? "Saved for review" : "Save for flashcards"}</button></div>
        <div className={`term-visual ${selected.course === "ap-chem" ? "chemistry" : "biology"}`}><span>{selected.keyFact}</span><div className="orbit orbit-a" /><div className="orbit orbit-b" /><i /><i /><i /></div>
      </section>
      <section className="breakdown"><article><span className="section-label">01 / Complete breakdown</span><h2>What is {selected.term}?</h2><p>{selected.definition}</p>{!selected.reviewed && <p className="draft-note">Draft explanation · Not yet reviewed for AP alignment.</p>}</article><aside><span className="section-label">02 / Key data</span><dl><div><dt>Key idea</dt><dd>{selected.keyFact}</dd></div><div><dt>Study area</dt><dd>{selected.category}</dd></div><div><dt>Course alignment</dt><dd>{selected.course === "both" ? "Biology + Chemistry · Biology unit " : "Unit "}{selected.unit}</dd></div></dl></aside></section>
      <section className="related"><div><span className="section-label">03 / Connections</span><h2>Related concepts</h2></div><div className="related-links">{selected.connections.length ? selected.connections.map((r,i) => <button key={`${r.entry.id}-${i}`} onClick={() => openTerm(r.entry)}><span>{r.entry.term}<small>{r.reason}</small></span><Icon name="arrow" /></button>) : <p className="muted">More connections are being curated.</p>}</div></section>
      <section className="sources"><span className="section-label">04 / Sources & further reading</span><p>Original draft explanation. References below are for further reading and editorial review.</p>{selected.sources.map(source => <div key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.name} ↗</a><small>{source.attribution}<br />{source.license} · Recorded {source.retrievedOn}</small></div>)}</section>
    </main>}
    {view === "saved" && <main className="saved-page"><section className="saved-title"><span className="overline">Your study library</span><h1>Saved concepts</h1><p>A little collection of things worth knowing. Stored on this device.</p>{savedTerms.length > 0 && <button className="review-button" onClick={startCards}><Icon name="cards" /> Review as flashcards</button>}</section>
      {savedTerms.length ? <div className="saved-list">{savedTerms.map((entry,index) => <div className="saved-item" key={entry.id}><span>{String(index+1).padStart(2,"0")}</span><button onClick={() => openTerm(entry)}><small>{entry.category}</small><strong>{entry.term}</strong></button><span className="term-formula">{entry.keyFact}</span><button aria-label={`Remove ${entry.term} from saved`} className="remove" onClick={() => save(entry.id)}>Remove</button></div>)}</div> : <div className="empty-saved"><Icon name="bookmark" /><h2>No saved terms yet</h2><p>Save a concept to build your own study collection.</p><button onClick={() => navigate("home")}>Find a concept <Icon name="arrow" /></button></div>}
    </main>}
    {view === "flashcards" && <main className="flashcard-page"><div className="flashcard-top"><button className="back-link" onClick={() => navigate("saved")}><Icon name="back" /> View saved terms</button><label className="due-toggle"><input type="checkbox" checked={dueOnly} onChange={e => {setDueOnly(e.target.checked);setFlashcardIndex(0);setFlipped(false);}} /> Due only</label></div>
      {currentCard ? <><div className="flashcard-top"><span>{flashcardIndex % cards.length + 1} of {cards.length}</span><span>{study.cards[currentCard.id]?.repetitions ?? 0} reviews</span></div><div className="progress"><span style={{width:`${((flashcardIndex % cards.length + 1)/cards.length)*100}%`}} /></div><p className="flash-hint">Click the card to flip it</p><button aria-label={flipped ? "Show term" : "Reveal explanation"} className={flipped ? "flashcard flipped" : "flashcard"} onClick={() => setFlipped(f => !f)}>{!flipped ? <><span>Your study deck</span><h1>{currentCard.front}</h1><small>Click to reveal the explanation</small></> : <><span>Key things to remember</span><p>{currentCard.back}</p><small>{currentCard.keyFact}</small></>}</button>{flipped ? <div className="rating-buttons">{(["again","hard","good","easy"] as const).map(rating => <button key={rating} onClick={() => {setStudy(s => recordReview(s,currentCard.id,rating));setFlipped(false);if (!dueOnly) setFlashcardIndex(i => i+1);}}>{rating}<small>{rating === "again" ? "1 minute" : rating === "hard" ? "Short interval" : rating === "good" ? "Longer interval" : "Longest interval"}</small></button>)}</div> : <button className="next-card" onClick={() => {setFlashcardIndex(i => i+1);setFlipped(false);}}>Skip card <Icon name="arrow" /></button>}</> : <div className="empty-flashcards"><span className="empty-card-icon"><Icon name="cards" /></span><span className="overline">Your study deck</span><h1>{savedTerms.length ? "All caught up." : "No flashcards yet"}</h1><p>{savedTerms.length ? "No saved cards are due right now. Turn off Due only to practice them again." : "Save a few concepts first, then return here to study."}</p><button onClick={() => savedTerms.length ? setDueOnly(false) : navigate("home")}>{savedTerms.length ? "Practice all saved cards" : "Find terms to save"}<Icon name="arrow" /></button></div>}
    </main>}
    {view === "quiz" && <main className="quiz-page"><section className="saved-title"><span className="overline">Make it stick</span><h1>Test your connections.</h1><p>Short questions. Clear explanations. A little more understanding.</p></section>
      {!quiz.length ? <div className="quiz-setup"><label>Study from <select value={quizScope} onChange={e => setQuizScope(e.target.value as "all" | "saved")}><option value="all">All concepts</option><option value="saved">Saved concepts</option></select></label><p>Up to 8 questions · Progress stays on this device</p><button className="next-card" disabled={!ready || !catalog.quiz.some(q => quizScope === "all" || study.savedIds.includes(q.entryId))} onClick={startQuiz}>Start quiz <Icon name="arrow" /></button>{!catalog.quiz.some(q => quizScope === "all" || study.savedIds.includes(q.entryId)) && <p>{preview ? "Save concepts with questions, or choose All concepts." : "Open the draft preview to try the sample quiz."}</p>}{study.quizHistory.length > 0 && <p>Last attempt: {study.quizHistory.at(-1)!.correct}/{study.quizHistory.at(-1)!.total}</p>}</div> : complete && score ? <div className="quiz-result"><span className="overline">Session complete</span><h2>{score.correct} / {score.total}</h2><p>{score.percent}% correct · {score.correct === score.total ? "Nicely connected." : "Every explanation is another connection."}</p>{score.results.filter(r => !r.correct).map(r => <div className="answer-review" key={r.questionId}><strong>{quiz.find(q => q.id === r.questionId)?.prompt}</strong><p>{r.explanation}</p></div>)}<button className="next-card" onClick={() => {setQuiz([]);setComplete(false);}}>Try another quiz <Icon name="arrow" /></button></div> : question && <section className="question"><span className="overline">Question {quizIndex+1} / {quiz.length}</span><div className="progress"><span style={{width:`${((quizIndex+1)/quiz.length)*100}%`}} /></div><h2>{question.prompt}</h2><div className="answer-options">{question.choices.map((answer,index) => <button key={answer} disabled={choice !== undefined} aria-pressed={choice === index} className={feedback && index === feedback.correctIndex ? "correct" : choice === index ? "incorrect" : ""} onClick={() => setAnswers(a => ({...a,[question.id]:index}))}><span>{String.fromCharCode(65+index)}</span>{answer}</button>)}</div>{feedback && <div className="quiz-feedback" role="status"><strong>{feedback.correct ? "That's right." : "Not quite—here's the connection."}</strong><p>{feedback.explanation}</p><button className="next-card" onClick={nextQuestion}>{quizIndex+1 === quiz.length ? "See results" : "Next question"}<Icon name="arrow" /></button></div>}</section>}
    </main>}
    <footer>{brand}<span>Clear explanations for curious minds.</span><small>No accounts. Just curiosity.</small></footer>
  </div>;
}
