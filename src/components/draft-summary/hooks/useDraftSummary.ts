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

const PATIENT_ID = "mrn2096";
const ACCOUNT_NUMBER = "acc2096";

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatInline(text: string) {
  return text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
}

function markdownToHtml(content: string) {
  content = content.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n");

  const lines = content.split("\n");

  let html = "";

  let inOl = false;
  let inUl = false;
  let inLi = false; // 👈 track current <li>

  const closeUl = () => {
    if (inUl) {
      html += "</ul>";
      inUl = false;
    }
  };

  const closeLi = () => {
    closeUl();

    if (inLi) {
      html += "</li>";
      inLi = false;
    }
  };

  const closeOl = () => {
    closeLi();

    if (inOl) {
      html += "</ol>";
      inOl = false;
    }
  };

  const closeAll = () => {
    closeOl();
  };

  for (let raw of lines) {
    const line = raw.trim();

    if (!line) continue;

    const escaped = escapeHtml(line);
    const formatted = formatInline(escaped);

    /* ---------- Ordered list ---------- */
    if (/^\d+\.\s/.test(line)) {
      closeLi();

      if (!inOl) {
        html += "<ol>";
        inOl = true;
      }

      html += `<li>${formatted.replace(/^\d+\.\s/, "")}`;
      inLi = true;

      continue;
    }

    /* ---------- Nested unordered list ---------- */
    if (/^\- /.test(line)) {
      if (!inLi) continue;

      if (!inUl) {
        html += "<ul>";
        inUl = true;
      }

      html += `<li>${formatted.replace(/^\- /, "")}</li>`;
      continue;
    }

    /* ---------- Paragraph ---------- */
    closeAll();
    html += `<p>${formatted}</p>`;
  }

  closeAll();

  return html;
}
function sectionsToHtml(sections: any[]): string {
  if (!sections?.length) return "";

  return sections
    .map((s) => {
      const title = escapeHtml(
        String(s.title || "")
          .replace(/:$/, "")
          .trim(),
      );

      const body = markdownToHtml(String(s.content || ""));

      return `
        <section class="doc-section">
          <h3 class="doc-title">${title}</h3>
          <div class="doc-body">
            ${body}
          </div>
        </section>
      `;
    })
    .join("");
}
export const useDraftSummary = () => {
  const {
    prepareDraft,
    invokeAgent,
    commitDraft,
    discardDraft,
    currentVersion,
    dirty,
    history,
    rollback,
    lastEdits,
    getVersionSnapshot,
    sections,
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

  const currentHtmlRef = useRef("");
  const hasPrepared = useRef(false);

  /* ----------------------------------
     Init
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

  // Sync editor when sections update (and not in preview mode)
  useEffect(() => {
    if (!sections?.length || previewVersion) return;
    const html = sectionsToHtml(sections);
    currentHtmlRef.current = html;
    setContent(html);
    if (editor) editor.commands.setContent(html);
  }, [sections]); // eslint-disable-line react-hooks/exhaustive-deps

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

  /* ----------------------------------
     Preview — read only, no DB writes
     Clicking current version exits preview
  ---------------------------------- */
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

  /* ----------------------------------
     Restore — creates new version from snapshot (append-only audit trail)
     Exits preview mode after restoring
  ---------------------------------- */
  const handleRollback = useCallback(
    async (version: string) => {
      if (!version) return;
      try {
        await rollback(version);
        setPreviewVersion(null);
        setPreviewSections(null);
        // sections useEffect will re-sync the editor automatically
      } catch (err: any) {
        toast.error(err.message);
      }
    },
    [rollback],
  );

  /* ----------------------------------
     Discard — resets mutable sections table to last committed version
     Called when user cancels the diff viewer
  ---------------------------------- */
  const handleDiscard = useCallback(async () => {
    try {
      await discardDraft();
      // sections useEffect will re-sync editor automatically
    } catch (err: any) {
      toast.error(err.message);
    }
  }, [discardDraft]);

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
    rollback,
    commitDraft,
    discardDraft,
    handleDiscard,
    previewVersion,
    previewSections,
    isPreviewing,
    handlePreviewVersion,
    handleRollback,
  };
};
