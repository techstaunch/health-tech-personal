import "./App.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";
import DraftSummary from "./pages/draft-summary";
import { DraftProvider } from "./providers/DraftProvider";
import { useState } from "react";
// import { useValidateToken } from "./hooks/use-validate-token";

function App() {
  const [token] = useState<{ raw: string; payload: any } | null>({
    raw: import.meta.env.VITE_TEST_TOKEN,
    payload: {
      "sub": "237",
      "iat": "1775114120",
      "nameid": "mrn004",
      "sid": "acc004",
      "nbf": 1775114120,
      "exp": 1775115920,
      "iss": "SAINCE",
      "aud": "TECHSTAUNCH"
    },
  });
  // const { validate } = useValidateToken();
  // const isInIframe = window.self !== window.top;

  // useEffect(() => {
  //   if (isInIframe) {
  //     console.log("App is running inside an iframe");

  //     // Notify parent .NET app that React is ready
  //     window.parent.postMessage({ type: "READY" }, "*");

  //     // Listen for accessToken from the parent window
  //     const handleMessage = async (event: MessageEvent) => {
  //       if (event.data && event.data.accessToken) {
  //         console.log("Received accessToken from parent app");
  //         try {
  //           const payload = await validate(event.data.accessToken);
  //           console.log("Token validated successfully (Backend):", payload);
  //           setToken({ raw: event.data.accessToken, payload });

  //           // Store token in localStorage
  //           localStorage.setItem("accessToken", event.data.accessToken);
  //         } catch (error) {
  //           console.error("Failed to validate token from parent app");
  //         }
  //       }
  //     };

  //     window.addEventListener("message", handleMessage);

  //     return () => {
  //       window.removeEventListener("message", handleMessage);
  //     };
  //   }
  // }, [isInIframe]);

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
