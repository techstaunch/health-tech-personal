import { normalizeVersion } from "@/components/discharge/VersionHistoryDropdown";
import { useDraft } from "@/providers/DraftProvider";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { htmlToSections } from "../htmlToSections";

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

const PATIENT_ID = "mrn2097";
const ACCOUNT_NUMBER = "acc2097";

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
  let inLi = false;

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

    if (/^\- /.test(line)) {
      if (!inLi) continue;

      if (!inUl) {
        html += "<ul>";
        inUl = true;
      }

      html += `<li>${formatted.replace(/^\- /, "")}</li>`;
      continue;
    }

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

      const idAttr = s.id
        ? ` data-section-id="${escapeHtml(String(s.id))}"`
        : "";

      return `
        <section class="doc-section">
          <h3 class="doc-title"${idAttr}>${title}</h3>
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
    references,
    saveInline,
    isSaving,
    isDiscarding,
    isRollingBack,
    isInlineSaving,
    isPreviewing,
    isAnyLoading,
  } = useDraft();

  const [content, setContent] = useState("");
  const [showVoice, setShowVoice] = useState(false);
  const [editor, setEditor] = useState<any>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  const [previewVersion, setPreviewVersion] = useState<string | null>(null);
  const [previewSections, setPreviewSections] = useState<any[] | null>(null);

  const [inlineDirty, setInlineDirty] = useState(false);
  const [showInlineConfirm, setShowInlineConfirm] = useState(false);

  const currentHtmlRef = useRef("");
  const hasPrepared = useRef(false);

  const [loading, setLoading] = useState(false);
  const normalizedCurrentVersion = normalizeVersion(currentVersion);
  const normalizedPreviewVersion = normalizeVersion(previewVersion);

  const canEnableVoice = normalizedPreviewVersion
    ? normalizedPreviewVersion === normalizedCurrentVersion
    : true;

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
  }, []);

  useEffect(() => {
    if (!sections?.length || previewVersion) return;
    const html = sectionsToHtml(sections);
    currentHtmlRef.current = html;
    setContent(html);
    setInlineDirty(false);
    if (editor) editor.commands.setContent(html);
  }, [sections]);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
  }, []);

  const handleDocChanged = useCallback(() => {
    setInlineDirty(true);
  }, []);

  const handleTranscript = useCallback(
    async (text: string) => {
      try {
        setLoading(true);
        setShowDiff(true);
        await invokeAgent([{ role: "user", content: text }]);
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
    } finally {
    }
  }, [commitDraft, content]);

  const handleRefresh = useCallback(() => {
    const html = sectionsToHtml(sections);
    if (editor) editor.commands.setContent(html);
    setContent(html);
    currentHtmlRef.current = html;
    setInlineDirty(false);
    toast.success("Editor refreshed");
  }, [editor, sections]);

  const handleConfirmInlineSave = useCallback(async () => {
    try {
      const parsedSections = htmlToSections(content);
      await saveInline(PATIENT_ID, ACCOUNT_NUMBER, parsedSections);
      setShowInlineConfirm(false);
      setInlineDirty(false);
      currentHtmlRef.current = content;
    } catch (err: any) {
      toast.error(err.message);
    } finally {
    }
  }, [content, saveInline]);

  const handlePreviewVersion = useCallback(
    async (version: string) => {
      if (normalizeVersion(version) === normalizedCurrentVersion) {
        setPreviewVersion(null);
        setPreviewSections(null);
        setContent(currentHtmlRef.current);
        if (editor) editor.commands.setContent(currentHtmlRef.current);
        return;
      }

      try {
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
      }
    },
    [currentVersion, normalizedCurrentVersion, getVersionSnapshot, editor],
  );

  const handleRollback = useCallback(
    async (version: string) => {
      if (!version) return;
      try {
        await rollback(version);
        setPreviewVersion(null);
        setPreviewSections(null);
      } catch (err: any) {
        toast.error(err.message);
      } finally {
      }
    },
    [rollback],
  );

  const handleDiscard = useCallback(async () => {
    try {
      await discardDraft();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
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
    loading, // AI agent / voice transcript call
    isSaving, // commit draft
    isDiscarding, // discard draft
    isRollingBack, // rollback to a version
    isInlineSaving, // save inline edits as new version
    isPreviewing, // fetching a version snapshot for preview
    isAnyLoading, // any of the above — useful for disabling the whole UI
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
    handlePreviewVersion,
    handleRollback,
    references,
    canEnableVoice,
    // inline edit
    inlineDirty,
    showInlineConfirm,
    setShowInlineConfirm,
    handleConfirmInlineSave,
    handleDocChanged,
  };
};
