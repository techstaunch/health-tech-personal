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
    if (isInIframe) {
      console.log("App is running inside an iframe");

      // Notify parent .NET app that React is ready
      window.parent.postMessage({ type: "READY" }, "*");

      // Listen for accessToken from the parent window
      const handleMessage = async (event: MessageEvent) => {
        if (event.data && event.data.accessToken) {
          console.log("Received accessToken from parent app");
          try {
            const payload = await validate(event.data.accessToken);
            console.log("Token validated successfully (Backend):", payload);
            setToken({ raw: event.data.accessToken, payload });

            // Store token in localStorage
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
  }, [isInIframe]);

  const handleTestToken = async () => {
    const testToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImVlNzhmZjY2LWRkZWItNDE4Ni05NDYwLWZmODE5OGVkNTRkYiJ9.eyJzdWIiOiIyMzciLCJpYXQiOiIxNzc0ODY5MzQ3IiwibmFtZWlkIjoibXJuMDA0Iiwic2lkIjoiYWNjMDA0IiwibmJmIjoxNzc0ODY5MzQ3LCJleHAiOjE3NzQ4NzExNDcsImlzcyI6IlNBSU5DRSIsImF1ZCI6IlRFQ0hTVEFVTkNIIn0.aIFk2IO4YydrxxcZOq0iaOR8sVArb_hKGa74ftpaZopO-eK6UDvfi6IT7yBx6aN-uH9JeaJqPUQypF9wULrMkYvDcjj6IPnmRmtPn2hK1Sudw9lb5wuLdsW4WSzT4ymXdXoWcT6SPIZNT3EmbT4KRzX11UDTPwhovhtgK4vV_8VfYMP26f8F4ulcS1UUFBiAnpqhVEBP2xTbrNLABi5VOrzhccfYoHc3U6Fyd_dfcFWZJSe53V12FEKeGXza9BMOWT78O8XgYjP0OMjIg_c8oa6B1lE7kuohdhjXvVGSrxLdQgBLU2IIbQlKGPxzom5r0t2NmOTa7aQFxDnFCFJD9Q';
    try {
      const payload = await validate(testToken);
      setToken({ raw: testToken, payload });
      localStorage.setItem("accessToken", testToken);
      console.log("Test token validated successfully (Backend):", payload);
    } catch (error) {
      console.error("Test token validation failed:", error);
    }
  };

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {isInIframe && (
        <div className="fixed top-4 right-4 z-[9999]">
          <button
            onClick={handleTestToken}
            className="bg-primary text-white px-4 py-2 rounded-lg shadow-lg hover:bg-primary/90 transition-colors"
          >
            T
          </button>
        </div>
      )}
      <BrowserRouter>
        <DraftProvider syncToken={token?.raw} syncPayload={token?.payload}>
          <Routes>
            {/* <Route path="/" element={<Discharge />} /> */}
            <Route path="/" element={<DraftSummary />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </DraftProvider>
      </BrowserRouter>
    </TooltipProvider>
  );
}

export default App;
