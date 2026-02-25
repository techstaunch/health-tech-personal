import { useDraft } from "@/providers/DraftProvider";
import { useCallback, useEffect, useRef, useState } from "react";
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
  dirty: boolean;
}

/* ----------------------------------
   Hardcoded for now — wire to route params or auth context later
---------------------------------- */
const PATIENT_ID = "mrn2096";
const ACCOUNT_NUMBER = "acc2096";

/* ----------------------------------
   Helpers
---------------------------------- */

function cleanTitle(title: string) {
  return title.trim().replace(/:+$/, "").replace(/\s+/g, " ");
}

function sectionsToHtml(sections: any[]): string {
  if (!sections?.length) return "";
  return sections
    .map(
      (s) =>
        `<h3><strong>${cleanTitle(s.title)}</strong></h3><p>${String(s.content).replace(/\n/g, "<br/>")}</p><br/>`,
    )
    .join("");
}

export const useDraftSummary = () => {
  const {
    prepareDraft,
    invokeAgent,
    commitDraft,
    // discardDraft,
    currentVersion,
    dirty,
    history,
    rollback,
    lastEdits,
    getVersionSnapshot,
    sections,
    // metadata,
  } = useDraft();

  const [content, setContent] = useState("");
  const [showVoice, setShowVoice] = useState(false);
  const [editor, setEditor] = useState<any>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  const [previewVersion, setPreviewVersion] = useState<string | null>(null);
  const [previewSections, setPreviewSections] = useState<any[] | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  // Tracks the HTML of the active (non-preview) version so we can restore it
  const currentHtmlRef = useRef("");

  const hasPrepared = useRef(false);

  /* ----------------------------------
     Prepare Draft (on mount)
  ---------------------------------- */

  useEffect(() => {
    if (hasPrepared.current) return;
    hasPrepared.current = true;

    const init = async () => {
      try {
        setIsPreparing(true);
        await prepareDraft(PATIENT_ID, ACCOUNT_NUMBER);
      } catch {
        toast.error("Failed to prepare draft");
      } finally {
        setIsPreparing(false);
      }
    };

    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!sections?.length || previewVersion) return;
    const html = sectionsToHtml(sections);
    currentHtmlRef.current = html;
    setContent(html);
    if (editor) editor.commands.setContent(html);
  }, [sections]);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
  }, []);

  const handleTranscript = useCallback(
    async (text: string) => {
      try {
        setLoading(true);
        setShowDiff(true);
        await invokeAgent([{ role: "user", content: text }]);
        toast.success("AI edit applied");
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    },
    [invokeAgent],
  );

  const handleSave = useCallback(async () => {
    try {
      await commitDraft("anonymous");
      currentHtmlRef.current = content;
      toast.success("Version committed");
    } catch (err: any) {
      toast.error(err.message);
    }
  }, [commitDraft, content]);

  const handleRefresh = useCallback(() => {
    const html = sectionsToHtml(sections);
    if (editor) editor.commands.setContent(html);
    setContent(html);
    currentHtmlRef.current = html;
    toast.success("Editor refreshed");
  }, [editor, sections]);

  const handlePreviewVersion = useCallback(
    async (version: string) => {
      if (version === currentVersion) {
        setPreviewVersion(null);
        setPreviewSections(null);
        setContent(currentHtmlRef.current);
        if (editor) editor.commands.setContent(currentHtmlRef.current);
        return;
      }

      try {
        setIsPreviewing(true);
        const snapshot = await getVersionSnapshot(version);
        if (snapshot) {
          setPreviewVersion(version);
          setPreviewSections(snapshot.sections);
          const html = sectionsToHtml(snapshot.sections);
          setContent(html);
          if (editor) editor.commands.setContent(html);
        }
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setIsPreviewing(false);
      }
    },
    [currentVersion, getVersionSnapshot, editor],
  );

  const handleCheckoutVersion = useCallback(
    async (version: string) => {
      try {
        await rollback(version);
        setPreviewVersion(null);
        setPreviewSections(null);
        toast.success(`Checked out ${version}`);
      } catch (err: any) {
        toast.error(err.message);
      }
    },
    [rollback],
  );

  const handleRollback = useCallback(
    async (version: string) => {
      if (!version) return;
      await rollback(version);
    },
    [rollback],
  );

  return {
    content,
    showVoice,
    setShowVoice,
    editor,
    setEditor,
    isPreparing,
    handleContentChange,
    handleTranscript,
    handleSave,
    handleRefresh,
    loading,
    showDiff,
    setShowDiff,
    currentVersion,
    dirty,
    history,
    lastEdits,
    // metadata,
    rollback,
    commitDraft,
    // discardDraft,
    previewVersion,
    previewSections,
    isPreviewing,
    handlePreviewVersion,
    handleCheckoutVersion,
    handleRollback,
  };
};
