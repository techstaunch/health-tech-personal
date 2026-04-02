import React, {
  createContext,
  useCallback,
  useContext,
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
  position: number;
}

export interface SignoffData {
  signatureDataUrl: string;
  signedAt: string;
  signedBy: string;
  isSigned: boolean;
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

  isPreparing: boolean;
  isInvoking: boolean;
  isSaving: boolean;
  isDiscarding: boolean;
  isRollingBack: boolean;
  isInlineSaving: boolean;
  isPreviewing: boolean;
  isAnyLoading: boolean;

  signoff: SignoffData | null;
  isSigned: boolean;
  openSignoff: boolean;
  setOpenSignoff: (open: boolean) => void;
  handleSignoffConfirm: (signatureDataUrl: string) => void;
  setPatientId: (patientId: string) => void;
  setAccountNumber: (accountNumber: string) => void;
  prepareDraft: (patientId: string, accountNumber: string) => Promise<void>;
  invokeAgent: (messages: any[], sectionId?: string | null) => Promise<void>;
  discardDraft: () => Promise<void>;
  commitDraft: (createdBy?: string) => Promise<void>;
  rollback: (version: string) => Promise<void>;
  getVersionSnapshot: (version: string) => Promise<VersionSnapshot | null>;
  saveInline: (
    patientId: string,
    accountNumber: string,
    sections: InlineSection[],
  ) => Promise<void>;
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  userId: string;
}

const DraftContext = createContext<DraftContextValue | null>(null);

export const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/clinical";

const JSON_HEADERS = { "Content-Type": "application/json" };

export const DraftProvider: React.FC<{
  children: React.ReactNode;
  syncToken?: string | null;
  syncPayload?: any;
}> = ({ children, syncToken, syncPayload }) => {
  const [patientId, setPatientId] = useState<string | null>("");
  const [accountNumber, setAccountNumber] = useState<string | null>("");
  const [userId, setUserId] = useState<string>("anonymous");
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

  const [signoff, setSignoff] = useState<SignoffData | null>(null);
  const [openSignoff, setOpenSignoff] = useState(false);

  const isSigned = !!signoff;

  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem("accessToken"),
  );

  // Sync token and identity from props (e.g., from App.tsx/iframe)
  React.useEffect(() => {
    if (syncToken) {
      console.log('syncToken', syncToken);
      setAccessToken(syncToken);
      localStorage.setItem("accessToken", syncToken);
    }
  }, [syncToken]);

  React.useEffect(() => {
    if (syncPayload) {
      // payload contains nameid (MRN), sid (accountNumber), sub (userId)
      console.log('syncPayload', syncPayload);
      const data = syncPayload.payload || syncPayload;
      if (data.nameid) setPatientId(data.nameid);
      if (data.sid) setAccountNumber(data.sid);
      if (data.sub) setUserId(data.sub);
    }
  }, [syncPayload]);

  const isAnyLoading =
    isPreparing ||
    isInvoking ||
    isSaving ||
    isDiscarding ||
    isRollingBack ||
    isInlineSaving ||
    isPreviewing;

  const api = useCallback(
    async (url: string, options?: RequestInit) => {
      const headers = {
        ...JSON_HEADERS,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...options?.headers,
      };

      const res = await fetch(`${BASE_URL}${url}`, {
        ...options,
        headers,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Request failed");
      }
      return res.json();
    },
    [accessToken],
  );

  const loadAllData = useCallback(
    async (pid: string, acc: string) => {
      const [draftRes, historyRes] = await Promise.all([
        api(`/drafts/${pid}/${acc}`),
        api(`/drafts/${pid}/${acc}/history`),
      ]);

      const draft = draftRes.data;

      setSections(draft.sections ?? []);
      setReferences(draft.references ?? []);
      setCurrentVersion(draft.currentVersion);
      setDirty(false);
      setHistory(historyRes.data ?? []);

      if (draft?.isSigned) {
        setSignoff({
          signedBy: draft.signedBy,
          signatureDataUrl: draft.signature,
          signedAt: draft.signedAt,
          isSigned: draft.isSigned,
        });
      } else {
        setSignoff(null);
      }
    },
    [api],
  );

  // Automatically load data when patient identity changes
  React.useEffect(() => {
    if (patientId && accountNumber) {
      loadAllData(patientId, accountNumber);
    }
  }, [patientId, accountNumber, loadAllData]);

  const refresh = useCallback(async () => {
    if (!patientId || !accountNumber) return;
    await loadAllData(patientId, accountNumber);
  }, [patientId, accountNumber, loadAllData]);

  const prepareDraft = useCallback(
    async (pid: string, acc: string) => {
      try {
        setIsPreparing(true);

        await api("/prepare-draft", {
          method: "POST",
          headers: JSON_HEADERS,
          body: JSON.stringify({ patientId: pid, accountNumber: acc, createdBy: userId }),
        });

        setPatientId(pid);
        setAccountNumber(acc);

        await loadAllData(pid, acc);
        toast.success("Draft ready");
      } catch (err: any) {
        toast.error(err?.message || "Server is waking up. Please try again.");
      } finally {
        setIsPreparing(false);
      }
    },
    [api, loadAllData, userId],
  );

  const invokeAgent = useCallback(
    async (messages: any[], sectionId?: string | null) => {
      if (!patientId || !accountNumber) return;

      try {
        setIsInvoking(true);

        const res = await api("/invoke", {
          method: "POST",
          headers: JSON_HEADERS,
          body: JSON.stringify({
            patientId,
            accountNumber,
            messages,
            sectionId: sectionId ?? undefined,
          }),
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
    async (createdBy?: string) => {
      if (!patientId || !accountNumber) return;

      try {
        setIsSaving(true);

        const res = await api(`/drafts/${patientId}/${accountNumber}/commit`, {
          method: "POST",
          headers: JSON_HEADERS,
          body: JSON.stringify({ createdBy: createdBy || userId }),
        });

        setCurrentVersion(res.data.version);
        setDirty(false);
        setLastEdits(null);

        await refresh();
        toast.success("Changes applied.");
      } catch (err: any) {
        toast.error(err?.message || "Commit failed");
      } finally {
        setIsSaving(false);
      }
    },
    [api, patientId, accountNumber, refresh, userId],
  );

  const discardDraft = useCallback(async () => {
    if (!patientId || !accountNumber) return;

    try {
      setIsDiscarding(true);
      setDirty(false);
      setLastEdits(null);

      await refresh();
      toast.info("No changes made");
    } catch (err: any) {
      toast.error(err?.message || "Discard failed");
    } finally {
      setIsDiscarding(false);
    }
  }, [patientId, accountNumber, refresh]);

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
            createdBy: userId,
          }),
        });

        await refresh();
        toast.success(`Draft rolled back to ${version}`);
      } catch (err: any) {
        toast.error(err?.message || "Rollback failed");
      } finally {
        setIsRollingBack(false);
      }
    },
    [api, patientId, accountNumber, refresh, userId],
  );

  const handleSignoffConfirm = useCallback(
    async (_signatureDataUrl: string) => {
      if (!patientId || !accountNumber) return;

      try {
        setIsSaving(true);

        const timezoneOffset = Intl.DateTimeFormat().resolvedOptions().timeZone;

        await api(`/drafts/${patientId}/${accountNumber}/sign`, {
          method: "POST",
          headers: JSON_HEADERS,
          body: JSON.stringify({
            signedBy: userId,
            // signatureImageData: signatureDataUrl,
            timezoneOffset,
          }),
        });

        setOpenSignoff(false);
        await refresh();

        toast.success("Document signed and locked");
      } catch (err: any) {
        toast.error(err?.message || "Signing failed");
      } finally {
        setIsSaving(false);
      }
    },
    [api, patientId, accountNumber, refresh, userId],
  );

  const saveInline = useCallback(
    async (pid: string, acc: string, inlineSections: InlineSection[]) => {
      try {
        setIsInlineSaving(true);

        await api(`/drafts/${pid}/${acc}/save-inline`, {
          method: "POST",
          headers: JSON_HEADERS,
          body: JSON.stringify({
            patientId: pid,
            accountNumber: acc,
            sections: inlineSections,
            createdBy: userId,
          }),
        });

        await loadAllData(pid, acc);
        toast.success("Version saved");
      } catch (err: any) {
        toast.error(err?.message || "Inline save failed");
      } finally {
        setIsInlineSaving(false);
      }
    },
    [api, loadAllData, userId],
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

      signoff,
      isSigned,
      openSignoff,
      setOpenSignoff,
      handleSignoffConfirm,
      setAccountNumber,
      setPatientId,
      prepareDraft,
      invokeAgent,
      discardDraft,
      commitDraft,
      rollback,
      getVersionSnapshot,
      saveInline,
      accessToken,
      setAccessToken,
      userId,
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
      signoff,
      isSigned,
      openSignoff,
      handleSignoffConfirm,
      prepareDraft,
      invokeAgent,
      discardDraft,
      commitDraft,
      rollback,
      getVersionSnapshot,
      saveInline,
      accessToken,
      userId,
    ],
  );

  return (
    <DraftContext.Provider value={value}>{children}</DraftContext.Provider>
  );
};

export const useDraft = (): DraftContextValue => {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error("useDraft must be used inside DraftProvider");
  return ctx;
};
