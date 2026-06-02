import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/index.css";
import App from "@/App";
import DiscoveryApp from "@/features/discovery/DiscoveryApp";
import { Toaster } from "@/components/ui/toaster";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

// ─── Route bootstrap ──────────────────────────────────────────────────────
// Discovery E-Questionnaire runs as a STANDALONE app at /discovery/*
// (tanpa login, tanpa sidebar ERP). Routing internal di-handle DiscoveryApp.
const isDiscoveryRoute =
  typeof window !== "undefined" &&
  window.location.pathname.startsWith("/discovery");

const Root = isDiscoveryRoute ? DiscoveryApp : App;

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Root />
      <Toaster />
    </QueryClientProvider>
  </React.StrictMode>,
);
