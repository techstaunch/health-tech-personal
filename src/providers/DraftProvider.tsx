import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
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

interface DraftContextValue {
  patientId: string | null;
  accountNumber: string | null;

  sections: any[];
  references: Reference[];
  currentVersion: string | null;
  history: HistoryItem[];

  dirty: boolean;
  lastEdits: AgentResult | null;

  prepareDraft: (patientId: string, accountNumber: string) => Promise<void>;
  invokeAgent: (messages: any[]) => Promise<void>;
  discardDraft: () => Promise<void>;
  commitDraft: (createdBy: string) => Promise<void>;
  rollback: (version: string) => Promise<void>;
  getVersionSnapshot: (version: string) => Promise<VersionSnapshot | null>;
}

const DraftContext = createContext<DraftContextValue | null>(null);

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v2";

const JSON_HEADERS = { "Content-Type": "application/json" };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

  const api = useCallback(
    async (
      url: string,
      options?: RequestInit,
      retries = 2,
      allowRetryForMutation = false,
    ) => {
      const method = options?.method || "GET";
      const isMutation = method !== "GET";

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      try {
        const res = await fetch(`${BASE_URL}${url}`, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Request failed");
        }

        return res.json();
      } catch (err) {
        clearTimeout(timeout);

        const canRetry = retries > 0 && (!isMutation || allowRetryForMutation);

        if (canRetry) {
          await sleep(800);
          return api(url, options, retries - 1, allowRetryForMutation);
        }

        throw err;
      }
    },
    [],
  );

  useEffect(() => {
    fetch(`${BASE_URL}/health`).catch(() => {});
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
      setHistory(res.data);
    },
    [api],
  );

  const prepareDraft = useCallback(
    async (pid: string, acc: string) => {
      try {
        await api(
          "/prepare-draft",
          {
            method: "POST",
            headers: JSON_HEADERS,
            body: JSON.stringify({ patientId: pid, accountNumber: acc }),
          },
          2,
          true,
        );

        setPatientId(pid);
        setAccountNumber(acc);

        await Promise.all([loadDraft(pid, acc), loadHistory(pid, acc)]);

        toast.success("Draft ready");
      } catch (err: any) {
        toast.error(err?.message || "Server is waking up. Please try again.");
      }
    },
    [api, loadDraft, loadHistory],
  );

  const invokeAgent = useCallback(
    async (messages: any[]) => {
      if (!patientId || !accountNumber) throw new Error("Draft not ready");

      try {
        const res = await api(
          "/invoke",
          {
            method: "POST",
            headers: JSON_HEADERS,
            body: JSON.stringify({ patientId, accountNumber, messages }),
          },
          1,
          false,
        );

        const result: AgentResult = res.data;

        setLastEdits(result);
        setDirty(result.dirty);

        if (result.needsClarification)
          toast.warning(result.message ?? "Clarify");
      } catch (err: any) {
        toast.error(err?.message || "Failed to invoke AI");
      }
    },
    [api, patientId, accountNumber],
  );

  const discardDraft = useCallback(async () => {
    if (!patientId || !accountNumber) return;

    setDirty(false);
    setLastEdits(null);

    await loadDraft(patientId, accountNumber);

    toast.info("No changes made");
  }, [patientId, accountNumber, loadDraft]);

  const commitDraft = useCallback(
    async (createdBy: string) => {
      if (!patientId || !accountNumber) return;

      try {
        const res = await api(
          `/drafts/${patientId}/${accountNumber}/commit`,
          {
            method: "POST",
            headers: JSON_HEADERS,
            body: JSON.stringify({ createdBy }),
          },
          1,
          false,
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
      }
    },
    [api, patientId, accountNumber, loadDraft, loadHistory],
  );

  const rollback = useCallback(
    async (version: string) => {
      if (!patientId || !accountNumber) return;

      try {
        await api(
          `/drafts/${patientId}/${accountNumber}/rollback`,
          {
            method: "POST",
            headers: JSON_HEADERS,
            body: JSON.stringify({
              targetVersion: version,
              createdBy: "anonymous",
            }),
          },
          1,
          false,
        );

        setDirty(false);

        await Promise.all([
          loadDraft(patientId, accountNumber),
          loadHistory(patientId, accountNumber),
        ]);

        toast.success(`Rolled back to ${version}`);
      } catch (err: any) {
        toast.error(err?.message || "Rollback failed");
      }
    },
    [api, patientId, accountNumber, loadDraft, loadHistory],
  );

  const getVersionSnapshot = useCallback(
    async (version: string) => {
      if (!patientId || !accountNumber) return null;

      const res = await api(
        `/drafts/${patientId}/${accountNumber}/versions/${version}`,
      );

      return res.data ?? null;
    },
    [api, patientId, accountNumber],
  );

  return (
    <DraftContext.Provider
      value={{
        patientId,
        accountNumber,
        sections,
        references,
        currentVersion,
        history,
        dirty,
        lastEdits,
        discardDraft,
        prepareDraft,
        invokeAgent,
        commitDraft,
        rollback,
        getVersionSnapshot,
      }}
    >
      {children}
    </DraftContext.Provider>
  );
};

export const useDraft = (): DraftContextValue => {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error("useDraft must be used inside DraftProvider");
  return ctx;
};
