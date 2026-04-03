import "./App.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";
import DraftSummary from "./pages/draft-summary";
import { DraftProvider } from "./providers/DraftProvider";
import { useEffect, useState } from "react";
import { useValidateToken } from "./hooks/use-validate-token";

function App() {
  const [token, setToken] = useState<{ raw: string; payload: any } | null>(null);
  const { validate } = useValidateToken();
  const isInIframe = window.self !== window.top;

  useEffect(() => {
    // 1. Initial check: If token is in localStorage, use it immediately
    const storedToken = localStorage.getItem("accessToken");
    if (storedToken && !token) {
      console.log("Loading existing token from localStorage");
      setToken({ raw: storedToken, payload: null });
    }
  }, []);

  useEffect(() => {
    if (isInIframe) {
      console.log("App is running inside an iframe, notifying parent...");
      // Notify parent .NET app that React is ready
      window.parent.postMessage({ type: "READY" }, "*");
    }
  }, [isInIframe]);

  useEffect(() => {
    if (isInIframe) {
      const handleMessage = async (event: MessageEvent) => {
        // SECURITY NOTE: In production, uncomment and set your allowed origin
        // if (event.origin !== "https://your-parent-app.com") return;

        if (event.data && event.data.accessToken) {
          // Use the current token value from state
          if (token?.raw === event.data.accessToken) {
            console.log("Received same token, skipping validation.");
            return;
          }

          console.log("Received new accessToken from parent app");
          try {
            const payload = await validate(event.data.accessToken);
            setToken({ raw: event.data.accessToken, payload });
            localStorage.setItem("accessToken", event.data.accessToken);
          } catch (error) {
            console.error("Failed to validate token from parent app");
          }
        }
      };

      window.addEventListener("message", handleMessage);
      return () => {
        window.removeEventListener("message", handleMessage);
      };
    }
  }, [isInIframe, token?.raw, validate]);

  // const handleTestToken = async () => {
  //   const testToken = import.meta.env.VITE_TEST_TOKEN;
  //   try {
  //     const payload = await validate(testToken);
  //     setToken({ raw: testToken, payload });
  //     localStorage.setItem("accessToken", testToken);
  //     console.log("Test token validated successfully (Backend):", payload);
  //   } catch (error) {
  //     console.error("Test token validation failed:", error);
  //   }
  // };

  // useEffect(() => {
  //   if (!isInIframe) {
  //     handleTestToken();
  //   }
  // }, [isInIframe]);

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <DraftProvider syncToken={token?.raw} syncPayload={token?.payload}>
          <Routes>
            <Route path="/" element={<DraftSummary />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </DraftProvider>
      </BrowserRouter>
    </TooltipProvider>
  );
}

export default App;
