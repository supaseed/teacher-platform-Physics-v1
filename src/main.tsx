import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ColorSchemeScript, MantineProvider, localStorageColorSchemeManager } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";

import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "katex/dist/katex.min.css";
import "./index.css";

import { App } from "./App";
import { QuizProvider } from "./state/QuizContext";
import { theme } from "./theme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ColorSchemeScript defaultColorScheme="light" />
    <MantineProvider
      theme={theme}
      defaultColorScheme="light"
      colorSchemeManager={localStorageColorSchemeManager({ key: "mantine-color-scheme-value" })}
    >
      <Notifications position="top-right" />
      <QueryClientProvider client={queryClient}>
        <QuizProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QuizProvider>
      </QueryClientProvider>
    </MantineProvider>
  </StrictMode>,
);
