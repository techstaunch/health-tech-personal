import React from "react";
import type { EditResponse } from "../draft-summary/hooks/useDraftSummary";

interface Props {
  editResponse: EditResponse | null;
  loading: boolean;
}

const EditDiffViewer: React.FC<Props> = ({ editResponse, loading }) => {
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

  if (!editResponse) {
    return null;
  }

  if (!editResponse.success) {
    return (
      <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/10 text-sm text-destructive">
        {editResponse.message || "Failed to process updates"}
      </div>
    );
  }

  if (!editResponse.edits?.length) {
    return (
      <div className="p-4 rounded-lg border bg-muted/40 text-sm text-muted-foreground text-center">
        No changes were detected
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold">Updated Sections</h2>

      {editResponse.edits.map((edit, index) => (
        <div key={index} className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="mb-2 text-xs font-medium text-red-600">
                Original
              </div>

              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                {edit.original}
              </pre>
            </div>

            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <div className="mb-2 text-xs font-medium text-green-600">
                Updated
              </div>

              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                {edit.updated}
              </pre>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EditDiffViewer;
