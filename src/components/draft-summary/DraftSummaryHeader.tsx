import { Mic, Save, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DraftSummaryHeaderProps {
    onRefresh: () => void;
    onVoiceClick: () => void;
    onSave: () => void;
    isPreparing?: boolean;
}

const DraftSummaryHeader = ({ onRefresh, onVoiceClick, onSave, isPreparing }: DraftSummaryHeaderProps) => {
    return (
        <header className="flex items-center justify-between px-4 py-3 border-b bg-card shadow-sm sticky top-0 z-10">
            <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Draft Summary
                </h1>
                {isPreparing && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-primary/5 text-primary text-xs font-medium rounded-full animate-pulse">
                        <Wand2 className="h-3 w-3" />
                        <span>Preparing AI...</span>
                    </div>
                )}
            </div>
            <div className="flex gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRefresh}
                    className="gap-2 text-muted-foreground hover:text-foreground"
                >
                    <Wand2 className="h-4 w-4" />
                    <span>Reset Template</span>
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onVoiceClick}
                    className="gap-2 rounded-full border-primary/20 hover:border-primary/50 transition-colors"
                >
                    <Mic className="h-4 w-4 text-primary" />
                    <span>Voice</span>
                </Button>
                <Button
                    size="sm"
                    onClick={onSave}
                    className="gap-2 rounded-full shadow-lg shadow-primary/20"
                >
                    <Save className="h-4 w-4" />
                    <span>Save</span>
                </Button>
            </div>
        </header>
    );
};

export default DraftSummaryHeader;
