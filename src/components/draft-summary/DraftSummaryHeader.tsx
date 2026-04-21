import { Button } from "@/components/ui/button";
import { useDraft } from "@/providers/DraftProvider";
import { BookOpen, History, Mic, Save, Signature, Wand2 } from "lucide-react";
import { useState } from "react";
import ReferenceViewer from "../discharge/ReferenceViewer";
import VersionHistoryDropdown, {
  type VersionHistoryDropdownProps,
} from "../discharge/VersionHistoryDropdown";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import DraftSummaryToolbar from "./DraftSummaryToolbar";
import InputHistoryPanel from "./InputHistoryPanel";

interface Reference {
  id: string;
  title: string;
  content: string;
}

interface DraftSummaryHeaderProps
  extends VersionHistoryDropdownProps {
  onRefresh: () => void;
  onVoiceClick: () => void;
  onSave: () => void;
  isPreparing?: boolean;
  setShowInlineConfirm: React.Dispatch<React.SetStateAction<boolean>>;
  isContentLoading?: boolean;
  editor: any;
  dirty?: boolean;
  isPreviewing?: boolean;
  openSignoff: () => void;
  voiceDisabled?: boolean;
  references?: Reference[];
  inlineDirty?: boolean;
  patientId?: string;
  accountNumber?: string;
}

const DraftSummaryHeader = ({
  onRefresh,
  onVoiceClick,
  onSave,
  isPreparing,
  editor,
  signoff,
  dirty,
  isPreviewing,
  references = [],
  isContentLoading,
  voiceDisabled,
  openSignoff,
  setShowInlineConfirm,
  inlineDirty,
  patientId,
  accountNumber,
  ...props
}: DraftSummaryHeaderProps) => {
  const [showRefs, setShowRefs] = useState(false);
  const [showInputHistory, setShowInputHistory] = useState(false);
  const { accessToken, userId } = useDraft();

  return (
    <>
      <header className="flex flex-col lg:flex-row lg:items-center justify-between px-4 py-3 border-b bg-card shadow-sm sticky top-0 z-20 gap-4 lg:gap-0">
        <div className="flex flex-wrap items-center gap-3">
          <DraftSummaryToolbar editor={editor} />

          {(patientId || accountNumber) && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="hidden sm:block h-4 w-px bg-border mx-1" />
              {patientId && (
                <span className="text-[11px] text-muted-foreground bg-muted/40 border px-2 py-1 rounded-md">
                  patientId: <span className="font-medium text-foreground">{patientId}</span>
                </span>
              )}
              {accountNumber && (
                <span className="text-[11px] text-muted-foreground bg-muted/40 border px-2 py-1 rounded-md">
                  accountNumber: <span className="font-medium text-foreground">{accountNumber}</span>
                </span>
              )}
            </div>
          )}

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

        {
          <div className="flex flex-wrap items-center gap-2 mt-2 lg:mt-0">
            <VersionHistoryDropdown
              {...props}
              signoff={signoff}
              disabled={isContentLoading}
            />

            {patientId && accountNumber && (
              <div className="relative">
                <Button
                  variant={showInputHistory ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setShowInputHistory((v) => !v)}
                  className="gap-2 rounded-full transition-colors"
                >
                  <History className="h-4 w-4 text-muted-foreground" />
                  <span>Input History</span>
                </Button>

                <InputHistoryPanel
                  open={showInputHistory}
                  onClose={() => setShowInputHistory(false)}
                  patientId={patientId}
                  accountNumber={accountNumber}
                  userId={userId}
                  accessToken={accessToken}
                />
              </div>
            )}

            {references.length > 0 && (
              <div className="relative">
                <Button
                  variant={showRefs ? "secondary" : "outline"}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRefs((v) => !v);
                  }}
                  className="gap-2 rounded-full transition-colors"
                >
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span>References</span>
                  {references.length > 0 && (
                    <span className="text-[10px] bg-muted-foreground/15 text-muted-foreground px-1.5 py-0.5 rounded-full font-medium">
                      {references.length}
                    </span>
                  )}
                </Button>

                <ReferenceViewer
                  open={showRefs}
                  onClose={() => setShowRefs(false)}
                  references={references}
                />
              </div>
            )}
            {!signoff?.isSigned && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInlineConfirm(true)}
                  className="gap-2 rounded-full"
                  disabled={isContentLoading || voiceDisabled || !inlineDirty}
                >
                  <Save className="h-4 w-4 text-muted-foreground" />
                  <span>Save</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-full"
                  disabled={isContentLoading || voiceDisabled}
                  onClick={openSignoff}
                >
                  <Signature className="h-4 w-4 text-muted-foreground" />
                  <span>Sign off</span>
                </Button>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onVoiceClick}
                        disabled={voiceDisabled}
                        className="gap-2 rounded-full border-primary/20 hover:border-primary/50 transition-colors"
                      >
                        <Mic className="h-4 w-4 text-primary" />
                        <span>Voice</span>
                      </Button>
                    </span>
                  </TooltipTrigger>

                  {voiceDisabled && (
                    <TooltipContent side="bottom">
                      To start making changes, please make this version current
                      first.
                    </TooltipContent>
                  )}
                </Tooltip>
              </>
            )}
          </div>
        }
      </header>

    </>
  );
};

export default DraftSummaryHeader;
