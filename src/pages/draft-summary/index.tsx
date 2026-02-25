import EditDiffViewer from "@/components/discharge/EditDiffViewer";
import { VoicePanel } from "@/components/discharge/VoicePanel";
import DraftSummaryHeader from "@/components/draft-summary/DraftSummaryHeader";
import DraftSummaryToolbar from "@/components/draft-summary/DraftSummaryToolbar";
import { useDraftSummary } from "@/components/draft-summary/hooks/useDraftSummary";
import RichtextEditor from "@/components/draft-summary/RichtextEditor";
import { Button } from "@/components/ui/button";
import { RotateCcw, X } from "lucide-react";

const DraftSummary = () => {
  const {
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
    currentVersion,
    dirty,
    history,
    showDiff,
    setShowDiff,
    lastEdits,
    loading,
    commitDraft,
    // discardDraft,
    previewVersion,
    isPreviewing,
    handlePreviewVersion,
    handleCheckoutVersion,
    handleRollback,
  } = useDraftSummary();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <DraftSummaryHeader
        onRefresh={handleRefresh}
        onVoiceClick={() => setShowVoice(true)}
        onSave={handleSave}
        isPreparing={isPreparing}
      />

      <div className="px-6 py-2 flex items-center justify-between border-b bg-muted/20">
        <div className="flex items-center gap-3 text-xs">
          {currentVersion && (
            <span className="px-2 py-1 bg-background border rounded-md">
              {currentVersion}
            </span>
          )}

          {dirty && (
            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-md">
              Unsaved changes
            </span>
          )}

          {previewVersion && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md">
              Previewing {previewVersion}
            </span>
          )}
          {history.length > 0 && (
            <select
              className="px-2 py-1 text-xs border rounded-md bg-background"
              value={previewVersion ?? currentVersion ?? ""}
              onChange={(e) => handlePreviewVersion(e.target.value)}
            >
              {history.map((h) => (
                <option key={h.version} value={h.version}>
                  {h.version}
                  {h.isRollback ? " (rollback)" : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2">
          {previewVersion && previewVersion !== currentVersion && (
            <Button
              variant="outline"
              size="sm"
              disabled={isPreviewing}
              onClick={() => handleCheckoutVersion(previewVersion)}
            >
              Checkout {previewVersion}
            </Button>
          )}

          {!previewVersion && (
            <Button
              variant="outline"
              size="sm"
              disabled={!currentVersion || history.length <= 1}
              onClick={() =>
                handleRollback(history[history.length - 2]?.version)
              }
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Rollback
            </Button>
          )}
        </div>
      </div>

      <DraftSummaryToolbar editor={editor} />

      <main className="flex-1 p-4 md:p-8 overflow-auto flex justify-center bg-muted/10">
        <div className="w-full max-w-4xl bg-card border rounded-xl shadow-lg p-6 md:p-10 relative">
          <RichtextEditor
            content={content}
            onChange={handleContentChange}
            onEditorReady={setEditor}
          />
        </div>
      </main>

      {showVoice && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-sm">
          <div className="bg-card w-full max-w-3xl mx-auto rounded-t-3xl shadow-2xl overflow-hidden">
            <VoicePanel
              onTranscript={handleTranscript}
              onClose={() => setShowVoice(false)}
            />
          </div>
        </div>
      )}

      {showDiff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background w-full max-w-5xl max-h-[85vh] rounded-xl shadow-lg flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="text-sm font-semibold">Edit Preview</h3>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDiff(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <EditDiffViewer
                editResponse={lastEdits as any}
                loading={loading}
                commitDraft={commitDraft}
                // discardDraft={discardDraft}
                onClose={() => setShowDiff(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DraftSummary;
