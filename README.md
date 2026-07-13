# Physics Question Generator — Teacher Frontend

A teacher-friendly front-end for a Physics Question Generator, built with React + TypeScript + Vite and Mantine.

## Tech stack

- React 19 + TypeScript
- Vite
- Mantine UI v9 (`@mantine/core`, `@mantine/hooks`, `@mantine/notifications`)
- TanStack React Query
- `react-katex` + `katex` for LaTeX rendering
- `react-router-dom` for routing
- `@tabler/icons-react` for icons
- `window.print()` for PDF export (MVP)

## Configuration

The backend URL lives in a single constant:

```ts
// src/api/config.ts
export const API_BASE = "http://localhost:8000";
```

Change it there to point at your FastAPI server.

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check + production build
npm run preview  # preview the production build
npm run lint     # oxlint
```

## Project structure

```
src/
  api/
    config.ts        # API_BASE constant
    apiTypes.ts      # strict request/response types
    client.ts        # typed fetch wrapper (apiGet / apiPost)
    hooks.ts         # useSubtopicMeta / useGenerateQuiz / useCheckAnswer / useReportQuestion
  components/
    Katex.tsx        # react-katex wrapper with fallback
    SubtopicCard.tsx # one selectable equation card
    QuestionCard.tsx # quiz question (working area, options, equation, submit, report)
    ReportModal.tsx  # report-a-question modal
  pages/
    SelectorPage.tsx # homepage quiz selector (Paper 1 / Paper 2, tranches)
    QuizPage.tsx     # quiz display (list / single view, PDF export)
  state/
    QuizContext.tsx  # holds the ephemeral generated quiz across navigation
  utils/
    subtopics.ts     # data shaping + tranche availability/selection logic
    answers.ts       # MCQ option parsing + stable shuffle
  theme.ts           # Mantine theme
  App.tsx            # routes
  main.tsx           # providers (Mantine, React Query, Router, Quiz)
```

## Features

- **Selector** — two columns (Paper 1 / Paper 2), one card per subtopic with its
  equation rendered via KaTeX, a "Show AQA specification codes" toggle, and
  tranche controls (Standard vs Variants → Rearrangements / Conversions).
  Tranche checkboxes auto-disable when no selected subtopic supports that tranche.
- **Quiz** — List and Single views, per-question working-out area, reveal
  options (multiple choice) / reveal equation, answer checking with inline
  feedback, and a report-question modal.
- **PDF** — "Generate PDF" triggers `window.print()`; print CSS hides all UI
  chrome and shows just question numbers, text and a blank answer box.

## Notes

- Quiz data is ephemeral: it is held in React context (`QuizContext`), not the
  React Query cache, so it clears on refresh — as intended for generated quizzes.
- Subtopics that appear in both papers are treated as separate selectable items.
