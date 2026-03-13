import { Button } from "@/components/ui/button";
import { BookOpen, Mic, Save, Signature, Wand2 } from "lucide-react";
import { useState } from "react";
import PatientDropdown, {
  type PatientProps,
} from "../discharge/PatientDropdown";
import ReferenceViewer from "../discharge/ReferenceViewer";
import VersionHistoryDropdown, {
  type VersionHistoryDropdownProps,
} from "../discharge/VersionHistoryDropdown";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import DraftSummaryToolbar from "./DraftSummaryToolbar";

interface Reference {
  id: string;
  title: string;
  content: string;
}

interface DraftSummaryHeaderProps
  extends VersionHistoryDropdownProps, PatientProps {
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
  setAccountNumber,
  setPatientId,
  patientId,
  accountNumber,
  ...props
}: DraftSummaryHeaderProps) => {
  const [showRefs, setShowRefs] = useState(false);

  return (
    <>
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

        {
          <div className="flex items-center gap-2">
            <PatientDropdown
              setAccountNumber={setAccountNumber}
              setPatientId={setPatientId}
              patientId={patientId}
              accountNumber={accountNumber}
              disabled={isContentLoading}
            />
            <VersionHistoryDropdown
              {...props}
              signoff={signoff}
              disabled={isContentLoading}
            />

            {references.length > 0 && (
              <Button
                variant={showRefs ? "secondary" : "outline"}
                size="sm"
                onClick={() => setShowRefs((v) => !v)}
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

      <ReferenceViewer
        open={showRefs}
        onClose={() => setShowRefs(false)}
        references={references}
      />
    </>
  );
};

export default DraftSummaryHeader;
