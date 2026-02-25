import { Button } from "@/components/ui/button";
import { Mic, Wand2 } from "lucide-react";
import VersionHistoryDropdown, {
    type VersionHistoryDropdownProps,
} from "../discharge/VersionHistoryDropdown";
import DraftSummaryToolbar from "./DraftSummaryToolbar";

interface DraftSummaryHeaderProps extends VersionHistoryDropdownProps {
  onRefresh: () => void;
  onVoiceClick: () => void;
  onSave: () => void;
  isPreparing?: boolean;
  editor: any;
  dirty?: boolean;
  isPreviewing?: boolean;
}

const DraftSummaryHeader = ({
  onRefresh,
  onVoiceClick,
  onSave,
  isPreparing,
  editor,
  dirty,
  isPreviewing,
  ...props
}: DraftSummaryHeaderProps) => {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b bg-card shadow-sm sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <DraftSummaryToolbar editor={editor} />

        {isPreparing && (
          <div className="flex items-center gap-2 px-3 py-1 bg-primary/5 text-primary text-xs font-medium rounded-full animate-pulse">
            <Wand2 className="h-3 w-3" />
            <span>Preparing AI...</span>
          </div>
        )}

        {isPreviewing && (
          <div className="flex items-center gap-2 px-3 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-full animate-pulse">
            <span>Loading preview…</span>
          </div>
        )}

        {!isPreparing && !isPreviewing && dirty && (
          <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
            Unsaved changes
          </span>
        )}

        {!isPreparing &&
          !isPreviewing &&
          props.previewVersion &&
          props.previewVersion !== props.currentVersion && (
            <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              Previewing {props.previewVersion}
            </span>
          )}
      </div>

      <div className="flex items-center gap-2">
        <VersionHistoryDropdown {...props} />

        <Button
          variant="outline"
          size="sm"
          onClick={onVoiceClick}
          className="gap-2 rounded-full border-primary/20 hover:border-primary/50 transition-colors"
        >
          <Mic className="h-4 w-4 text-primary" />
          <span>Voice</span>
        </Button>

        {/* <Button
          size="sm"
          onClick={onSave}
          className="gap-2 rounded-full shadow-lg shadow-primary/20"
        >
          <Save className="h-4 w-4" />
          <span>Save</span>
        </Button> */}
      </div>
    </header>
  );
};

export default DraftSummaryHeader;
