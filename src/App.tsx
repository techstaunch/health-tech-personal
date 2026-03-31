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
    const testToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImVlNzhmZjY2LWRkZWItNDE4Ni05NDYwLWZmODE5OGVkNTRkYiJ9.eyJzdWIiOiIyMzciLCJpYXQiOiIxNzc0OTUzNTA1IiwibmFtZWlkIjoibXJuMDA0Iiwic2lkIjoiYWNjMDA0IiwibmJmIjoxNzc0OTUzNTA1LCJleHAiOjE3NzQ5NTUzMDUsImlzcyI6IlNBSU5DRSIsImF1ZCI6IlRFQ0hTVEFVTkNIIn0.OMnKcSjqozjo4uK1DlZet31QXNrqRXxpmc3m3kK04C-6uLvUQnWpyV6VD_UFu2bzeXTvqV7YvFZhkCJ1rZO1tTnnRmJKFGo9Oi-fdHNmdxVkGaMJ1DPfznqVoQ2Z7mXsDlWBXTTxUGcW0waLL_k5tlBcKir4CtpWuw7-te-AIXJegmFJ7wok-W63JRck0QgeoqqWD6OnCe4AJz95Y17Psqn98sCitHO57dvZOX7EvlgLNJho76HTCwQxbqmg1WyI0hVudm4SY5mwrjGYiXu3jo85Tu5S936Fu3OziH6fD3xLXeJN-vpn1A4sJx4O0qgeeEHHsA7cDj4GELfIGK2A7A';
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
