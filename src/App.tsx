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
  const [token, setToken] = useState<{ raw: string; payload: any } | null>(
    null,
  );
  const { validate } = useValidateToken();
  const isInIframe = window.self !== window.top;

  useEffect(() => {
    const storedToken = localStorage.getItem("accessToken");
    if (storedToken && !token) {
      console.log("Loading existing token from localStorage");
      setToken({ raw: storedToken, payload: null });
    }
  }, []);

  useEffect(() => {
    if (isInIframe) {
      console.log("App is running inside an iframe, notifying parent...");
      window.parent.postMessage({ type: "READY" }, "*");
    }
  }, [isInIframe]);

  useEffect(() => {
    if (isInIframe) {
      const handleMessage = async (event: MessageEvent) => {
        if (event.data && event.data.accessToken) {
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

  const mockToken = {
    raw: import.meta.env.VITE_TEST_TOKEN,
    payload: {
      sub: "237",
      iat: "1775114120",
      nameid: "mrn004",
      sid: "acc004",
      nbf: 1775114120,
      exp: 1775115920,
      iss: "SAINCE",
      aud: "TECHSTAUNCH",
    },
  };

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <DraftProvider
                syncToken={token?.raw}
                syncPayload={token?.payload}
              >
                <DraftSummary />
              </DraftProvider>
            }
          />
          <Route
            path="/test"
            element={
              <DraftProvider
                syncToken={mockToken.raw}
                syncPayload={mockToken.payload}
              >
                <DraftSummary />
              </DraftProvider>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
}

export default App;
