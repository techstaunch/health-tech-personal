import React, { createContext, useCallback, useContext, useState } from "react";

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

interface DraftContextValue {
  patientId: string | null;
  accountNumber: string | null;

  sections: any[];
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

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

export const DraftProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [patientId, setPatientId] = useState<string | null>(null);

  const [accountNumber, setAccountNumber] = useState<string | null>(null);

  const [sections, setSections] = useState<any[]>([]);

  const [currentVersion, setCurrentVersion] = useState<string | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [dirty, setDirty] = useState(false);

  const [lastEdits, setLastEdits] = useState<AgentResult | null>(null);

  const api = useCallback(async (url: string, options?: RequestInit) => {
    const res = await fetch(`${BASE_URL}${url}`, options);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Request failed");
    }

    return res.json();
  }, []);

  const loadDraft = useCallback(
    async (pid: string, acc: string) => {
      const res = await api(`/drafts/${pid}/${acc}`);

      setSections(res.data.sections);
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
      await api("/prepare-draft", {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({
          patientId: pid,
          accountNumber: acc,
        }),
      });

      setPatientId(pid);
      setAccountNumber(acc);

      await Promise.all([loadDraft(pid, acc), loadHistory(pid, acc)]);

      toast.success("Draft ready");
    },
    [api, loadDraft, loadHistory],
  );

  const invokeAgent = useCallback(
    async (messages: any[]) => {
      if (!patientId || !accountNumber) {
        throw new Error("Draft not ready");
      }

      const res = await api("/invoke", {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({
          patientId,
          accountNumber,
          messages,
        }),
      });

      const result: AgentResult = res.data;

      setLastEdits(result);
      setDirty(result.dirty);

      if (result.needsClarification) {
        toast.warning(result.message ?? "Clarify");
      }
    },
    [api, patientId, accountNumber],
  );
  const discardDraft = useCallback(async () => {
    if (!patientId || !accountNumber) return;
    // await api(`/drafts/${patientId}/${accountNumber}/discard`, {
    //   method: "POST",
    //   headers: JSON_HEADERS,
    // });
    setDirty(false);
    setLastEdits(null);
    await loadDraft(patientId, accountNumber);
    toast.info("No changes made");
  }, [api, patientId, accountNumber, loadDraft]);

  const commitDraft = useCallback(
    async (createdBy: string) => {
      if (!patientId || !accountNumber) return;

      const res = await api(`/drafts/${patientId}/${accountNumber}/commit`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ createdBy }),
      });

      setCurrentVersion(res.data.version);
      setDirty(false);
      setLastEdits(null);

      await Promise.all([
        loadDraft(patientId, accountNumber),
        loadHistory(patientId, accountNumber),
      ]);

      toast.success("Changes applied.");
    },
    [api, patientId, accountNumber, loadDraft, loadHistory],
  );

  const rollback = useCallback(
    async (version: string) => {
      if (!patientId || !accountNumber) return;

      await api(`/drafts/${patientId}/${accountNumber}/rollback`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({
          targetVersion: version,
          createdBy: "anonymous",
        }),
      });

      setDirty(false);

      await Promise.all([
        loadDraft(patientId, accountNumber),
        loadHistory(patientId, accountNumber),
      ]);

      toast.success(`Rolled back to ${version}`);
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

  if (!ctx) {
    throw new Error("useDraft must be used inside DraftProvider");
  }

  return ctx;
};
