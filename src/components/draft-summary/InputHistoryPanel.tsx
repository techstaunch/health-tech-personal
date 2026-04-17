import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, MessageSquare, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface InputHistoryItem {
  id: string;
  userId: string;
  sectionId: string | null;
  input: string;
  status: string;
  createdAt: string;
}

interface InputHistoryPanelProps {
  open: boolean;
  onClose: () => void;
  patientId: string;
  accountNumber: string;
  userId: string;
  accessToken: string | null;
}

const InputHistoryPanel = ({
  open,
  onClose,
  patientId,
  accountNumber,
  userId,
  accessToken,
}: InputHistoryPanelProps) => {
  const [history, setHistory] = useState<InputHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener("mousedown", handler);
    }

    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !patientId || !accountNumber) return;

    const fetchHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/clinical";
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };

        if (accessToken) {
          headers.Authorization = `Bearer ${accessToken}`;
        }

        const url = `${baseUrl}/drafts/${patientId}/${accountNumber}/input-history?userId=${userId}`;
        const response = await fetch(url, { headers });

        if (!response.ok) {
          throw new Error(`Failed to fetch input history: ${response.statusText}`);
        }

        const data = await response.json();
        const items = data.data || [];
        setHistory(Array.isArray(items) ? items : []);
      } catch (err: any) {
        setError(err.message || "Failed to load input history");
        console.error("Error fetching input history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [open, patientId, accountNumber, userId, accessToken]);

  const formatTimestamp = (ts: string) => {
    if (!ts) return "";
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="fixed right-4 top-16 w-96 rounded-xl border border-border bg-card shadow-2xl z-50 flex flex-col"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Input History</span>
          {!loading && !error && (
            <span className="text-[10px] text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded-full">
              {history.length}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-7 w-7 p-0 hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[420px]">
        <div className="p-3 space-y-2">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
            </div>
          )}

          {error && (
            <div className="text-center py-8 px-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {!loading && !error && history.length === 0 && (
            <div className="text-center py-8 px-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No input history yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Your voice inputs will appear here
              </p>
            </div>
          )}

          {!loading && !error && history.length > 0 && (
            <>
              {history.map((item, idx) => {
                const key = item.id || String(idx);
                const statusColor =
                  item.status === "accepted"
                    ? "bg-green-100 text-green-700"
                    : item.status === "rejected"
                      ? "bg-red-100 text-red-700"
                      : "bg-muted text-muted-foreground";

                return (
                  <div
                    key={key}
                    className="rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors p-3"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] text-muted-foreground">
                        {formatTimestamp(item.createdAt)}
                      </span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${statusColor}`}>
                        {item.status}
                      </span>
                    </div>

                    <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap break-words">
                      {item.input}
                    </p>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default InputHistoryPanel;
