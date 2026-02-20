import EditDiffViewer from "@/components/discharge/EditDiffViewer";
import { VoicePanel } from "@/components/discharge/VoicePanel";
import DraftSummaryHeader from "@/components/draft-summary/DraftSummaryHeader";
import DraftSummaryToolbar from "@/components/draft-summary/DraftSummaryToolbar";
import { useDraftSummary } from "@/components/draft-summary/hooks/useDraftSummary";
import RichtextEditor from "@/components/draft-summary/RichtextEditor";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

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
    loading,
    editResponse,
    setShowDiff,
    showDiff,
  } = useDraftSummary();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <DraftSummaryHeader
        onRefresh={handleRefresh}
        onVoiceClick={() => setShowVoice(true)}
        onSave={handleSave}
        isPreparing={isPreparing}
      />

      <DraftSummaryToolbar editor={editor} />

      <main className="flex-1 p-4 md:p-8 overflow-auto flex justify-center bg-muted/10">
        <div className="w-full max-w-4xl bg-card border rounded-xl shadow-lg p-6 md:p-10 focus-within:ring-2 ring-primary/20 transition-all duration-300 relative">
          <RichtextEditor
            content={content}
            onChange={handleContentChange}
            onEditorReady={setEditor}
          />
        </div>
      </main>

      {showVoice && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-3xl mx-auto rounded-t-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
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
            {/* Header */}
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

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <EditDiffViewer editResponse={editResponse} loading={loading} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DraftSummary;
