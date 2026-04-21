import AlertDialog from "@/components/discharge/AlertDialog";
import EditDiffViewer from "@/components/discharge/EditDiffViewer";
import { VoicePanel } from "@/components/discharge/VoicePanel";
import DraftSummaryHeader from "@/components/draft-summary/DraftSummaryHeader";
import { useDraftSummary } from "@/components/draft-summary/hooks/useDraftSummary";
import RichtextEditor from "@/components/draft-summary/RichtextEditor";
import { toast } from "sonner";
import { useState } from "react";
// import SignoffModal from "./SignoffModal";
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
    handleRollback,
    references,
    inlineDirty,
    showInlineConfirm,
    setShowInlineConfirm,
    handleConfirmInlineSave,
    handleDocChanged,
    isDiscarding,
    isInlineSaving,
    isRollingBack,
    isSaving,
    canEnableVoice,
    selectedSectionId,
    setSelectedSectionId,
    // signoff
    signoff,
    isSigned,
    openSignoff,
    setOpenSignoff,
    handleSignoffConfirm,
    patientId,
    accountNumber,
  } = useDraftSummary();
  const [voiceAnchorElement, setVoiceAnchorElement] = useState<HTMLElement | null>(null);
  const isContentLoading =
    isInlineSaving ||
    isDiscarding ||
    isSaving ||
    isRollingBack ||
    isPreviewing ||
    isPreparing ||
    loading; // loading from hook represents invokeAgent state
  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <DraftSummaryHeader
        onRefresh={handleRefresh}
        onVoiceClick={() => {
          if (!selectedSectionId) {
            toast.error("Please select a section first");
            return;
          }
          setVoiceAnchorElement(null); // No anchor for header button
          setShowVoice(true);
        }}
        onSave={handleSave}
        signoff={signoff}
        isPreparing={isPreparing}
        versions={history}
        currentVersion={currentVersion}
        previewVersion={previewVersion}
        onPreview={handlePreviewVersion}
        onRestore={handleRollback}
        onCompare={handlePreviewVersion}
        editor={editor}
        dirty={dirty}
        references={references}
        isPreviewing={isPreviewing}
        voiceDisabled={!canEnableVoice || isContentLoading || isSigned}
        isContentLoading={isContentLoading}
        inlineDirty={inlineDirty}
        setShowInlineConfirm={setShowInlineConfirm}
        openSignoff={() => setOpenSignoff(true)}
        patientId={patientId || undefined}
        accountNumber={accountNumber || undefined}
      />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto flex justify-center items-start bg-muted/10 min-h-0">
        <div className="w-full max-w-4xl bg-card border rounded-xl shadow-lg p-6 md:p-10 relative self-start">
          <RichtextEditor
            content={content}
            onChange={handleContentChange}
            onEditorReady={setEditor}
            onDocChanged={handleDocChanged}
            isPreparing={isContentLoading}
            selectedSectionId={selectedSectionId}
            onSectionSelect={setSelectedSectionId}
            editable={!isSigned}
            voiceDisabled={!canEnableVoice || isContentLoading || isSigned}
            onOpenVoice={(anchorElement) => {
              setVoiceAnchorElement(anchorElement || null);
              setShowVoice(true);
            }}
            signoff={signoff}
            isCurrent={
              previewVersion ? previewVersion === currentVersion : true
            }
            signedBy={signoff?.signedBy}
          />
          {isSigned && (
            <div className="absolute inset-0 rounded-xl cursor-default" />
          )}
        </div>
      </main>
      <AlertDialog
        open={showInlineConfirm}
        onOpenChange={setShowInlineConfirm}
        onConfirm={handleConfirmInlineSave}
        content={{
          title: "Save as new version?",
          description:
            "This will create a new version with your inline changes. The current version will remain in the history and can be restored at any time.",
          actionText: "Save version",
        }}
      />
      <AlertDialog
        open={openSignoff}
        onOpenChange={setOpenSignoff}
        onConfirm={() => handleSignoffConfirm("")}
        content={{
          title: "Confirm Sign Off",
          description: "Are you sure you want to sign off on this document?",
          actionText: "Sign off",
        }}
      />
      {showVoice && (
        <VoicePanel
          onTranscript={handleTranscript}
          onClose={() => setShowVoice(false)}
          open={showVoice}
          anchorElement={voiceAnchorElement}
        />
      )}
      {showDiff && (
        <div className="border-t shadow-[0_-4px_24px_rgba(0,0,0,0.08)] flex-shrink-0">
          <EditDiffViewer
            editResponse={lastEdits as any}
            loading={loading}
            commitDraft={commitDraft}
            onClose={async () => setShowDiff(false)}
            handleDiscard={handleDiscard}
          />
        </div>
      )}
    </div>
  );
};
export default DraftSummary;