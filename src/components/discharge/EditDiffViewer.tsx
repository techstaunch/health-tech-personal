import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import React from "react";
import type { EditResponse } from "../draft-summary/hooks/useDraftSummary";

interface Props {
  editResponse: EditResponse | null;
  loading: boolean;
  onClose?: () => void;
  commitDraft: (createdBy: string) => Promise<void>; 
}

const EditDiffViewer: React.FC<Props> = ({
  editResponse,
  loading,
  onClose,
  commitDraft, 
}) => {
  /* ----------------------------------
     Loading
  ---------------------------------- */

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <h2 className="text-lg font-semibold text-muted-foreground">
          Processing Updates
        </h2>

        {[0, 1].map((i) => (
          <div key={i} className="grid grid-cols-2 gap-4">
            <div className="h-28 rounded-xl bg-muted" />
            <div className="h-28 rounded-xl bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (!editResponse) return null;

  if (!editResponse.success) {
    return (
      <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/10 text-sm text-destructive">
        {editResponse.message || "Failed to process updates"}
      </div>
    );
  }

  if (editResponse.needsClarification) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 border border-amber-300 bg-amber-50 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />

          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">Clarification Required</p>

            <p>
              {editResponse.message ||
                "The assistant needs more information before making changes."}
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  if (!editResponse.edits?.length) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-lg border bg-muted/40 text-sm text-muted-foreground text-center">
          No changes were detected
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  const handleMerge = async () => {
    await commitDraft("anonymous");
    if (onClose) onClose();
  };
  const handleDiscard = async () => { 
    if (onClose) onClose();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-green-600" />
        <h2 className="text-lg font-semibold">Review AI Changes</h2>
      </div>

      {editResponse.message && (
        <div className="text-sm text-muted-foreground border-l-2 pl-3">
          {editResponse.message}
        </div>
      )}

      <div className="space-y-6">
        {editResponse.edits.map((edit, index) => (
          <div key={index} className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">{edit.title}</h4>

              <span className="text-xs text-muted-foreground">
                Confidence: {(edit.confidence * 100).toFixed(0)}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="mb-2 text-xs font-medium text-red-600">
                  Original
                </div>

                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {edit.original}
                </pre>
              </div>

              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <div className="mb-2 text-xs font-medium text-green-600">
                  Updated
                </div>

                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {edit.updated}
                </pre>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={handleDiscard}>
          Cancel
        </Button>

        <Button onClick={handleMerge}>Merge Changes</Button>
      </div>
    </div>
  );
};

export default EditDiffViewer;
