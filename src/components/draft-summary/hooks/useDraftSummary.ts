import { useState, useEffect, useCallback } from "react";
import dischargeData from "@/constants/JSON/mrn2034_acc2034_ai_generated_discharge_summary.json";
import { toast } from "sonner";

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
    useEffect(() => {
        const saved = localStorage.getItem("draft_summary_content");
        if (saved && saved !== "<p></p>" && saved !== "") {
            setContent(saved);
        } else {
            const initialHtml = formatJsonToHtml(dischargeData);
            setContent(initialHtml);
            localStorage.setItem("draft_summary_content", initialHtml);
        }
    }, [formatJsonToHtml]);

    const [isPreparing, setIsPreparing] = useState(false);
    const [prepareError, setPrepareError] = useState<string | null>(null);

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

            const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
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
            } catch (error) {
                if (isMounted) {
                    const message = error instanceof Error ? error.message : "An unknown error occurred";
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

    const handleTranscript = useCallback((text: string) => {
        if (editor) {
            editor.commands.insertContent(`<p>${text}</p>`);
            handleContentChange(editor.getHTML());
        }
        setShowVoice(false);
        toast.success("Transcript added to draft");
    }, [editor, handleContentChange]);

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
        handleRefresh
    };
};
