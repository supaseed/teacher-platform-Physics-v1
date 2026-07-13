import { useMutation, useQuery } from "@tanstack/react-query";
import { apiGet, apiPost } from "./client";
import type {
  GenerateQuizRequest,
  GenerateQuizResponse,
  ReportQuestionRequest,
  ReportQuestionResponse,
  SubtopicMetaResponse,
} from "./apiTypes";
import { normalizeGenerateQuizResponse } from "./normalize";

/** GET /subtopic-meta */
export function useSubtopicMeta() {
  return useQuery<SubtopicMetaResponse>({
    queryKey: ["subtopic-meta"],
    queryFn: () => apiGet<SubtopicMetaResponse>("/subtopic-meta"),
    staleTime: 5 * 60 * 1000,
  });
}

/** POST /generate-quiz */
export function useGenerateQuiz() {
  return useMutation<GenerateQuizResponse, Error, GenerateQuizRequest>({
    mutationFn: async (body) => {
      const raw = await apiPost<Record<string, unknown>, GenerateQuizRequest>(
        "/generate-quiz",
        body,
      );
      return normalizeGenerateQuizResponse(raw);
    },
  });
}

/** POST /report-question */
export function useReportQuestion() {
  return useMutation<ReportQuestionResponse, Error, ReportQuestionRequest>({
    mutationFn: (body) =>
      apiPost<ReportQuestionResponse, ReportQuestionRequest>(
        "/report-question",
        body,
      ),
  });
}
