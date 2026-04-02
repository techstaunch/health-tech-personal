import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DiffMatchPatch from "diff-match-patch";
import { CheckCircle2, GitCompare, X } from "lucide-react";
import React, { useMemo, useState } from "react";
import type { EditResponse } from "../draft-summary/hooks/useDraftSummary";
import { useDraft } from "@/providers/DraftProvider";

const dmp = new DiffMatchPatch();

function computeWordDiffs(original: string, updated: string) {
  const tokens: string[] = [];
  const tokenMap = new Map<string, number>();

  function encode(text: string): string {
    return (text.match(/\S+\s*|\s+/g) ?? [])
      .map((tok) => {
        if (!tokenMap.has(tok)) {
          tokenMap.set(tok, tokens.length);
          tokens.push(tok);
        }
        return String.fromCodePoint(0xe000 + tokenMap.get(tok)!);
      })
      .join("");
  }

  const encoded1 = encode(original);
  const encoded2 = encode(updated);
  const diffs = dmp.diff_main(encoded1, encoded2, false);
  dmp.diff_cleanupSemantic(diffs);

  return diffs.map(([op, chars]) => ({
    op,
    text: [...chars].map((c) => tokens[c.codePointAt(0)! - 0xe000]).join(""),
  }));
}

function InlineDiff({
  original,
  updated,
}: {
  original: string;
  updated: string;
}) {
  const diffs = useMemo(
    () => computeWordDiffs(original ?? "", updated ?? ""),
    [original, updated],
  );

  return (
    <div className="flex flex-row rounded-lg overflow-hidden border border-border text-[13px] leading-relaxed">
      {/* Before */}
      <div className="flex-1 min-w-0 p-3 bg-muted/20">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground/50 font-semibold mb-1.5">
          Before
        </div>
        <p className="whitespace-pre-wrap break-words text-foreground/80">
          {diffs.map(({ op, text }, i) => {
            if (op === 1) return null;
            if (op === 0) return <span key={i}>{text}</span>;
            return (
              <mark
                key={i}
                style={{
                  background: "rgba(239,68,68,0.1)",
                  color: "rgba(185,28,28,0.85)",
                }}
                className="rounded-[3px] px-0.5 line-through decoration-red-300/60"
              >
                {text}
              </mark>
            );
          })}
        </p>
      </div>

      <div className="w-px bg-border shrink-0" />

      {/* After */}
      <div className="flex-1 min-w-0 p-3 bg-muted/10">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground/50 font-semibold mb-1.5">
          After
        </div>
        <p className="whitespace-pre-wrap break-words text-foreground/80">
          {diffs.map(({ op, text }, i) => {
            if (op === -1) return null;
            if (op === 0) return <span key={i}>{text}</span>;
            return (
              <mark
                key={i}
                style={{
                  background: "rgba(34,197,94,0.1)",
                  color: "rgba(21,128,61,0.9)",
                }}
                className="rounded-[3px] px-0.5"
              >
                {text}
              </mark>
            );
          })}
        </p>
      </div>
    </div>
  );
}

/* ============================================================================
   Main Component
============================================================================ */

interface Props {
  editResponse: EditResponse | null;
  loading: boolean;
  onClose?: () => void;
  commitDraft: (createdBy?: string) => Promise<void>;
  handleDiscard: () => Promise<void>;
}

const EditDiffViewer: React.FC<Props> = ({
  editResponse,
  loading,
  onClose,
  commitDraft,
  handleDiscard,
}) => {
  const { userId } = useDraft();
  const [iLoading, setILoading] = useState(false);
  if (loading || iLoading) {
    return (
      <div className="border-t border-border bg-card">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
          <div className="h-7 w-24 rounded bg-muted animate-pulse" />
          <div className="ml-auto h-7 w-16 rounded bg-muted animate-pulse" />
        </div>
        <div className="p-4 space-y-3">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="rounded-md border border-border p-3 space-y-2 animate-pulse"
            >
              <div className="h-3 w-32 rounded bg-muted" />
              <div className="h-8 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!editResponse) return null;

  if (!editResponse.success) {
    return (
      <div className="border-t border-border bg-card">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <span className="text-sm font-medium text-muted-foreground">
            Review Changes
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4">
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {editResponse.message || "Failed to process updates"}
          </div>
        </div>
      </div>
    );
  }

  if (editResponse.needsClarification) {
    return (
      <div className="border-t border-border bg-card">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <span className="text-sm font-medium text-muted-foreground">
            Review Changes
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4">
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            <p className="font-medium mb-1">Clarification Required</p>
            <p>
              {editResponse.message ||
                "The assistant needs more information before making changes."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!editResponse.edits?.length) {
    return (
      <div className="border-t border-border bg-card">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <span className="text-sm font-medium text-muted-foreground">
            Review Changes
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4">
          <p className="text-sm text-muted-foreground text-center py-4">
            No changes were detected and {" "}
            {editResponse.message && !editResponse.edits.length && (
              <span className="text-sm text-muted-foreground">
                {editResponse.message}
              </span>
            )}
          </p>
        </div>
      </div>
    );
  }
  const handleAccept = async () => {
    setILoading(true);
    await commitDraft(userId);
    setILoading(false);
    onClose?.();
  };

  const handleCancel = async () => {
    onClose?.();
    await handleDiscard();
  };

  return (
    <div className="border-t border-border bg-card">
      <Tabs defaultValue="changes">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <TabsList className="h-8">
            <TabsTrigger value="changes" className="text-sm gap-1.5 h-7 px-3">
              <GitCompare className="h-3 w-3" />
              Changes
              <span className="ml-1 text-[11px] bg-primary/10 text-primary rounded-full px-1.5">
                {editResponse.edits.length}
              </span>
            </TabsTrigger>

            {editResponse.message && (
              <TabsTrigger value="summary" className="text-sm gap-1.5 h-7 px-3">
                <CheckCircle2 className="h-3 w-3" />
                Summary
              </TabsTrigger>
            )}
          </TabsList>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-sm"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button size="sm" className="h-7 text-sm" onClick={handleAccept}>
              Accept
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="changes" className="mt-0">
          <div className="max-h-64 overflow-y-auto p-4 space-y-2">
            {editResponse.edits.map((edit, index) => (
              <div
                key={index}
                className="rounded-md border border-border px-3 py-2.5"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-muted-foreground">
                    {edit.title}
                  </span>
                  <span className="text-[11px] text-muted-foreground/60">
                    {(edit.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
                <InlineDiff original={edit.original} updated={edit.updated} />
              </div>
            ))}
          </div>
        </TabsContent>

        {editResponse.message && (
          <TabsContent value="summary" className="mt-0">
            <div className="p-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {editResponse.message}
              </p>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default EditDiffViewer;
