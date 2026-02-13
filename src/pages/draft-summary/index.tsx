import { useDraftSummary } from "@/components/draft-summary/hooks/useDraftSummary";
import DraftSummaryHeader from "@/components/draft-summary/DraftSummaryHeader";
import DraftSummaryToolbar from "@/components/draft-summary/DraftSummaryToolbar";
import RichtextEditor from "@/components/draft-summary/RichtextEditor";
import { VoicePanel } from "@/components/discharge/VoicePanel";

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
        handleRefresh
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
        </div>
    );
};

export default DraftSummary;


