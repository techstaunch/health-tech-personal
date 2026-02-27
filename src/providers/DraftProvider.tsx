import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";

export interface PatchResult {
  title: string;
  original: string;
  updated: string;
  confidence: number;
}

export interface AgentResult {
  success: boolean;
  message: string | null;
  edits: PatchResult[];
  needsClarification: boolean;
  dirty: boolean;
}

export interface HistoryItem {
  version: string;
  createdBy: string;
  timestamp: string;
  isRollback: boolean;
}

export interface VersionSnapshot {
  version: string;
  createdBy: string;
  timestamp: string;
  isRollback: boolean;
  sections: any[];
}

export interface Reference {
  id: string;
  title: string;
  content: string;
}

export interface InlineSection {
  id?: string;
  title: string;
  content: string;
}

interface DraftContextValue {
  patientId: string | null;
  accountNumber: string | null;

  sections: any[];
  references: Reference[];
  currentVersion: string | null;
  history: HistoryItem[];

  dirty: boolean;
  lastEdits: AgentResult | null;

  // Loading states
  isPreparing: boolean;
  isInvoking: boolean;
  isSaving: boolean;
  isDiscarding: boolean;
  isRollingBack: boolean;
  isInlineSaving: boolean;
  isPreviewing: boolean;
  isAnyLoading: boolean;

  prepareDraft: (patientId: string, accountNumber: string) => Promise<void>;
  invokeAgent: (messages: any[]) => Promise<void>;
  discardDraft: () => Promise<void>;
  commitDraft: (createdBy: string) => Promise<void>;
  rollback: (version: string) => Promise<void>;
  getVersionSnapshot: (version: string) => Promise<VersionSnapshot | null>;
  saveInline: (
    patientId: string,
    accountNumber: string,
    sections: InlineSection[],
  ) => Promise<void>;
}

const DraftContext = createContext<DraftContextValue | null>(null);

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v2";

const JSON_HEADERS = { "Content-Type": "application/json" };

export const DraftProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [patientId, setPatientId] = useState<string | null>(null);
  const [accountNumber, setAccountNumber] = useState<string | null>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [dirty, setDirty] = useState(false);
  const [lastEdits, setLastEdits] = useState<AgentResult | null>(null);
 
  const [isPreparing, setIsPreparing] = useState(false);
  const [isInvoking, setIsInvoking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [isInlineSaving, setIsInlineSaving] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const isAnyLoading =
    isPreparing ||
    isInvoking ||
    isSaving ||
    isDiscarding ||
    isRollingBack ||
    isInlineSaving ||
    isPreviewing;

  const api = useCallback(async (url: string, options?: RequestInit) => {
    const res = await fetch(`${BASE_URL}${url}`, options);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Request failed");
    }
    return res.json();
  }, []);

  // Warm health endpoint
  useEffect(() => {
    try {
      const base = new URL(BASE_URL);
      let pathname = base.pathname.replace(/\/+$/, "");
      pathname = pathname.replace(/\/api(\/v\d+)?$/, "");
      const healthUrl = new URL(base.origin + pathname + "/health");
      fetch(healthUrl.toString(), { mode: "cors" }).catch(() => {});
    } catch (err) {
      console.error("Health warmup failed:", err);
    }
  }, []);

  const loadDraft = useCallback(
    async (pid: string, acc: string) => {
      const res = await api(`/drafts/${pid}/${acc}`);
      setSections(res.data.sections ?? []);
      setReferences(res.data.references ?? []);
      setCurrentVersion(res.data.currentVersion);
      setDirty(false);
    },
    [api],
  );

  const loadHistory = useCallback(
    async (pid: string, acc: string) => {
      const res = await api(`/drafts/${pid}/${acc}/history`);
      setHistory(res.data ?? []);
    },
    [api],
  );

  const prepareDraft = useCallback(
    async (pid: string, acc: string) => {
      try {
        setIsPreparing(true);

        await api("/prepare-draft", {
          method: "POST",
          headers: JSON_HEADERS,
          body: JSON.stringify({ patientId: pid, accountNumber: acc }),
        });

        setPatientId(pid);
        setAccountNumber(acc);

        await Promise.all([loadDraft(pid, acc), loadHistory(pid, acc)]);
        toast.success("Draft ready");
      } catch (err: any) {
        toast.error(err?.message || "Server is waking up. Please try again.");
      } finally {
        setIsPreparing(false);
      }
    },
    [api, loadDraft, loadHistory],
  );

  const invokeAgent = useCallback(
    async (messages: any[]) => {
      if (!patientId || !accountNumber) return;

      try {
        setIsInvoking(true);

        const res = await api("/invoke", {
          method: "POST",
          headers: JSON_HEADERS,
          body: JSON.stringify({ patientId, accountNumber, messages }),
        });

        const result: AgentResult = res.data;
        setLastEdits(result);
        setDirty(result.dirty);

        if (result.needsClarification)
          toast.warning(result.message ?? "Clarify");
      } catch (err: any) {
        toast.error(err?.message || "Failed to invoke AI");
      } finally {
        setIsInvoking(false);
      }
    },
    [api, patientId, accountNumber],
  );

  const commitDraft = useCallback(
    async (createdBy: string) => {
      if (!patientId || !accountNumber) return;

      try {
        setIsSaving(true);

        const res = await api(
          `/drafts/${patientId}/${accountNumber}/commit`,
          {
            method: "POST",
            headers: JSON_HEADERS,
            body: JSON.stringify({ createdBy }),
          },
        );

        setCurrentVersion(res.data.version);
        setDirty(false);
        setLastEdits(null);

        await Promise.all([
          loadDraft(patientId, accountNumber),
          loadHistory(patientId, accountNumber),
        ]);

        toast.success("Changes applied.");
      } catch (err: any) {
        toast.error(err?.message || "Commit failed");
      } finally {
        setIsSaving(false);
      }
    },
    [api, patientId, accountNumber, loadDraft, loadHistory],
  );

  const discardDraft = useCallback(async () => {
    if (!patientId || !accountNumber) return;

    try {
      setIsDiscarding(true);
      setDirty(false);
      setLastEdits(null);

      await loadDraft(patientId, accountNumber);
      toast.info("No changes made");
    } catch (err: any) {
      toast.error(err?.message || "Discard failed");
    } finally {
      setIsDiscarding(false);
    }
  }, [patientId, accountNumber, loadDraft]);

  const rollback = useCallback(
    async (version: string) => {
      if (!patientId || !accountNumber) return;

      try {
        setIsRollingBack(true);

        await api(`/drafts/${patientId}/${accountNumber}/rollback`, {
          method: "POST",
          headers: JSON_HEADERS,
          body: JSON.stringify({
            targetVersion: version,
            createdBy: "anonymous",
          }),
        });

        await Promise.all([
          loadDraft(patientId, accountNumber),
          loadHistory(patientId, accountNumber),
        ]);

        setDirty(false);
        toast.success(`Draft rolled back to ${version}`);
      } catch (err: any) {
        toast.error(err?.message || "Rollback failed");
      } finally {
        setIsRollingBack(false);
      }
    },
    [api, patientId, accountNumber, loadDraft, loadHistory],
  );

  const getVersionSnapshot = useCallback(
    async (version: string) => {
      if (!patientId || !accountNumber) return null;

      try {
        setIsPreviewing(true);
        const res = await api(
          `/drafts/${patientId}/${accountNumber}/versions/${version}`,
        );
        return res.data ?? null;
      } catch (err: any) {
        toast.error(err?.message || "Preview failed");
        return null;
      } finally {
        setIsPreviewing(false);
      }
    },
    [api, patientId, accountNumber],
  );

  const saveInline = useCallback(
    async (pid: string, acc: string, inlineSections: InlineSection[]) => {
      try {
        setIsInlineSaving(true);

        const res = await api(`/drafts/${pid}/${acc}/save-inline`, {
          method: "POST",
          headers: JSON_HEADERS,
          body: JSON.stringify({
            patientId: pid,
            accountNumber: acc,
            sections: inlineSections,
          }),
        });

        await Promise.all([loadDraft(pid, acc), loadHistory(pid, acc)]);
        toast.success(res.message ?? "Version saved");
      } catch (err: any) {
        toast.error(err?.message || "Inline save failed");
      } finally {
        setIsInlineSaving(false);
      }
    },
    [api, loadDraft, loadHistory],
  );

  const value = useMemo(
    () => ({
      patientId,
      accountNumber,
      sections,
      references,
      currentVersion,
      history,
      dirty,
      lastEdits,

      isPreparing,
      isInvoking,
      isSaving,
      isDiscarding,
      isRollingBack,
      isInlineSaving,
      isPreviewing,
      isAnyLoading,

      prepareDraft,
      invokeAgent,
      discardDraft,
      commitDraft,
      rollback,
      getVersionSnapshot,
      saveInline,
    }),
    [
      patientId,
      accountNumber,
      sections,
      references,
      currentVersion,
      history,
      dirty,
      lastEdits,
      isPreparing,
      isInvoking,
      isSaving,
      isDiscarding,
      isRollingBack,
      isInlineSaving,
      isPreviewing,
      isAnyLoading,
      prepareDraft,
      invokeAgent,
      discardDraft,
      commitDraft,
      rollback,
      getVersionSnapshot,
      saveInline,
    ],
  );

  return (
    <DraftContext.Provider value={value}>
      {children}
    </DraftContext.Provider>
  );
};

export const useDraft = (): DraftContextValue => {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error("useDraft must be used inside DraftProvider");
  return ctx;
};