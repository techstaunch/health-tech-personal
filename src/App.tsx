import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import { useValidateToken } from "./hooks/use-validate-token";
import NotFound from "./pages/NotFound";
import DraftSummary from "./pages/draft-summary";
import { DraftProvider } from "./providers/DraftProvider";

function App() {
  const [token, setToken] = useState<{ raw: string; payload: any } | null>(
    null,
  );
  const { validate } = useValidateToken();
  const isInIframe = window.self !== window.top;
  const tokenRef = useRef<string | null>(null);
  useEffect(() => {
    console.group("🚀 [APP BOOT]");
    console.log("Is in iframe:", isInIframe);
    console.log("Current URL:", window.location.href);
    console.groupEnd();

    if (!isInIframe) {
      console.warn("⚠️ Not in iframe — token handshake will NOT run.");
      return;
    }

    const handleMessage = async (event: MessageEvent) => {
      console.group("📨 [MESSAGE FROM PARENT]");
      console.log("event.origin :", event.origin);
      console.log("event.data   :", event.data);
      console.log("Has accessToken:", !!event.data?.accessToken);
      console.groupEnd();

      if (!event.data?.accessToken) {
        console.warn(
          '❌ Message had no accessToken — check .NET ViewData["Token"] is populated',
        );
        return;
      }

      if (tokenRef.current === event.data.accessToken) {
        console.log("⚠️ Same token received again — skipping.");
        return;
      }

      console.group("🔐 [TOKEN VALIDATION]");
      console.log(
        "Raw token (first 40 chars):",
        event.data.accessToken.slice(0, 40),
      );
      try {
        const payload = await validate(event.data.accessToken);
        console.log("✅ Token valid! Payload:", payload);
        tokenRef.current = event.data.accessToken;
        setToken({ raw: event.data.accessToken, payload });
      } catch (error) {
        console.error("❌ Token validation FAILED:", error);
      }
      console.groupEnd();
    };

    console.log("👂 [LISTENER] Attaching message listener...");
    window.addEventListener("message", handleMessage);

    console.log("📤 [READY] Sending READY to parent...");
    window.parent.postMessage({ type: "READY" }, "*");
    console.log("✅ [READY] Sent.");

    return () => {
      console.log("🧹 [LISTENER] Removed.");
      window.removeEventListener("message", handleMessage);
    };
  }, []);

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
            path="/test"
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
            path="/"
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
