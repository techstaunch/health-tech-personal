import EditDiffViewer from "@/components/discharge/EditDiffViewer";
import { VoicePanel } from "@/components/discharge/VoicePanel";
import DraftSummaryHeader from "@/components/draft-summary/DraftSummaryHeader";
import { useDraftSummary } from "@/components/draft-summary/hooks/useDraftSummary";
import RichtextEditor from "@/components/draft-summary/RichtextEditor";

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
    handleDiscard,
    previewVersion,
    isPreviewing,
    handlePreviewVersion,
    handleRollback
  } = useDraftSummary();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <DraftSummaryHeader
        onRefresh={handleRefresh}
        onVoiceClick={() => setShowVoice(true)}
        onSave={handleSave}
        isPreparing={isPreparing}
        versions={history}
        currentVersion={currentVersion}
        previewVersion={previewVersion}
        onPreview={handlePreviewVersion}
        onRestore={handleRollback}
        onCompare={handlePreviewVersion}
        editor={editor}
        dirty={dirty}
        isPreviewing={isPreviewing}
      />

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
        <VoicePanel
          onTranscript={handleTranscript}
          onClose={() => setShowVoice(false)}
          open={showVoice}
        />
      )}

      {showDiff && (
        <div className="fixed bottom-0 left-0 right-0 z-40 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
          <EditDiffViewer
            editResponse={lastEdits as any}
            loading={loading}
            commitDraft={commitDraft}
            onClose={async () => {
              setShowDiff(false);
            }}
            handleDiscard={handleDiscard}
          />
        </div>
      )}
    </div>
  );
};

export default DraftSummary;