import { Navigate, Route, Routes } from "react-router-dom";
import { SelectorPage } from "./pages/SelectorPage";
import { QuizPage } from "./pages/QuizPage";
import { QuizReportPage } from "./pages/QuizReportPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<SelectorPage />} />
      <Route path="/quiz" element={<QuizPage />} />
      <Route path="/quiz/report" element={<QuizReportPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
