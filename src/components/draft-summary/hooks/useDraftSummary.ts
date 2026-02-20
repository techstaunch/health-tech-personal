import dischargeData from "@/constants/JSON/mrn2034_acc2034_ai_generated_discharge_summary.json";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export interface EditSection {
  confidence: number;
  original: string;
  title: string;
  updated: string;
}

export interface EditResponse {
  edits: EditSection[];
  message: string;
  needsClarification: boolean;
  success: boolean;
}

export const useDraftSummary = () => {
  const [content, setContent] = useState("");
  const [showVoice, setShowVoice] = useState(false);
  const [editor, setEditor] = useState<any>(null);

  const formatJsonToHtml = useCallback((data: any) => {
    let html = "";
    Object.entries(data).forEach(([key, value]) => {
      if (key === "References") return;
      html += `<h3><strong>${key}</strong></h3>`;
      html += `<p>${String(value).replace(/\n/g, "<br/>")}</p><br/>`;
    });
    return html;
  }, []);

  // Initialize content from local storage or JSON template
  //   useEffect(() => {
  //     const saved = localStorage.getItem("draft_summary_content");
  //     if (saved && saved !== "<p></p>" && saved !== "") {
  //       setContent(saved);
  //     } else {
  //       const initialHtml = formatJsonToHtml(dischargeData);
  //       setContent(initialHtml);
  //       localStorage.setItem("draft_summary_content", initialHtml);
  //     }
  //   }, [formatJsonToHtml]);

  const [isPreparing, setIsPreparing] = useState(false);
  const [prepareError, setPrepareError] = useState<string | null>(null);
  function cleanTitle(title: string) {
    return title
      .trim()
      .replace(/:+$/, "") // remove trailing colons
      .replace(/\s+/g, " ");
  }

  function sectionsToCleanObject(response: { data: { sections: any[] } }) {
    if (!response?.data?.sections) return {};

    return response.data.sections.reduce(
      (result: { [x: string]: any }, section: { title: any; content: any }) => {
        const key = cleanTitle(section.title);
        result[key] = section.content;
        return result;
      },
      {},
    );
  }
  // Call prepare-draft API once on mount
  useEffect(() => {
    let isMounted = true;
    const prepareDraft = async () => {
      if (isPreparing) return;

      setIsPreparing(true);
      setPrepareError(null);

      // Filter out References and wrap in draft key as per API requirement
      const { References, ...cleanData } = dischargeData as any;
      const payload = { draft: cleanData };

      const baseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
      try {
        const response = await fetch(`${baseUrl}/agent/prepare-draft`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Failed to prepare draft: ${response.statusText}`);
        }

        if (isMounted) {
          console.log("Draft prepared successfully");
        }
        const result = await response.json();
        const res = sectionsToCleanObject(result as any);
        console.log("res,res", res, result);
        setContent(formatJsonToHtml(res));
      } catch (error) {
        if (isMounted) {
          const message =
            error instanceof Error
              ? error.message
              : "An unknown error occurred";
          setPrepareError(message);
          console.error("Error preparing draft:", error);
          toast.error("Failed to prepare draft summary patterns");
        }
      } finally {
        if (isMounted) {
          setIsPreparing(false);
        }
      }
    };

    prepareDraft();

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array ensures it runs once on mount

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    localStorage.setItem("draft_summary_content", newContent);
  }, []);

  const [loading, setLoading] = useState(false);
  const [editResponse, setEditResponse] = useState<EditResponse | null>(null);
  const [showDiff, setShowDiff] = useState(false);

  const handleTranscript = useCallback(async (text: string) => {
    try {
      setShowDiff(true);
      setLoading(true);
      const baseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

      const endpoint = `${baseUrl}/agent/invoke`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: text }],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Request failed: ${errText}`);
      }

      const data = await response.json();
      setEditResponse(data.data);
      console.log(data);
    } catch (error: any) {
      setLoading(false);
      console.error("Error:", error.message || error);
    } finally {
      setLoading(false);
    }
    // if (editor) {
    //     editor.commands.insertContent(`<p>${text}</p>`);
    //     handleContentChange(editor.getHTML());
    // }
    // setShowVoice(false);
    // toast.success("Transcript added to draft");
  }, []);

  const handleSave = useCallback(() => {
    localStorage.setItem("draft_summary_content", content);
    toast.success("Draft saved successfully");
  }, [content]);

  const handleRefresh = useCallback(() => {
    const initialHtml = formatJsonToHtml(dischargeData);
    if (editor) {
      editor.commands.setContent(initialHtml);
    }
    setContent(initialHtml);
    localStorage.setItem("draft_summary_content", initialHtml);
    toast.success("Editor refreshed from JSON template");
  }, [editor, formatJsonToHtml]);

  return {
    content,
    showVoice,
    setShowVoice,
    editor,
    setEditor,
    isPreparing,
    prepareError,
    handleContentChange,
    handleTranscript,
    handleSave,
    handleRefresh,
    loading,
    editResponse,
    showDiff,
    setShowDiff,
  };
};
