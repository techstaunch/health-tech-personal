import { X, Mic, Square, Pause, Play, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import useVoice from "./hooks/use-voice-panel-v2";

interface VoicePanelProps {
    onTranscript: (text: string) => void;
    onClose: () => void;
}

export const VoicePanel = ({ onTranscript, onClose }: VoicePanelProps) => {

    const {
        isRecording,
        isPaused,
        recordingTime,
        audioBlob,
        isSupported,
        error,
        transcript,
        isTranscribing,
        transcriptionError,
        formatTime,
        handleToggleRecording,
        handleTogglePause,
        handleDone,
        handleCancel,
        handleRetry,
    } = useVoice({ onTranscript, onClose });

    return (
        <div className="border-t border-border bg-secondary/50 p-3 md:p-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between mb-3 md:mb-4">
                <h3 className="text-sm font-semibold text-foreground">
                    Voice Recording
                </h3>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCancel}
                    className="h-8 w-8"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Browser Support Warning */}
            {!isSupported && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-destructive">
                        Audio recording is not supported in your browser. Please try a modern browser like Chrome, Edge, or Safari.
                    </p>
                </div>
            )}

            {/* Error Message */}
            {error && isSupported && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-destructive">{error}</p>
                </div>
            )}

            <div className="flex flex-col items-center py-3 md:py-4">
                {/* Recording Controls */}
                <div className="flex items-center gap-4">
                    {/* Main Record Button */}
                    <button
                        onClick={handleToggleRecording}
                        disabled={!isSupported || isTranscribing}
                        className={cn(
                            "w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all",
                            "border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
                            isRecording
                                ? "bg-destructive text-destructive-foreground border-destructive"
                                : "bg-primary text-primary-foreground border-primary hover:opacity-90",
                            (!isSupported || isTranscribing) && "opacity-50 cursor-not-allowed",
                            isRecording && !isPaused && "animate-pulse"
                        )}
                        aria-label={isRecording ? "Stop recording" : "Start recording"}
                    >
                        {isRecording ? (
                            <Square className="h-6 w-6 md:h-8 md:w-8" />
                        ) : (
                            <Mic className="h-6 w-6 md:h-8 md:w-8" />
                        )}
                    </button>

                    {/* Pause/Resume Button */}
                    {isRecording && (
                        <button
                            onClick={handleTogglePause}
                            className={cn(
                                "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all",
                                "border-2 bg-background text-foreground border-border hover:border-foreground",
                                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                            )}
                            aria-label={isPaused ? "Resume recording" : "Pause recording"}
                        >
                            {isPaused ? (
                                <Play className="h-5 w-5 md:h-6 md:w-6" />
                            ) : (
                                <Pause className="h-5 w-5 md:h-6 md:w-6" />
                            )}
                        </button>
                    )}
                </div>

                {/* Recording Time */}
                {isRecording && (
                    <div className="mt-3 flex items-center gap-2">
                        <div className={cn(
                            "w-2 h-2 rounded-full bg-destructive",
                            !isPaused && "animate-pulse"
                        )} />
                        <p className="text-sm font-mono text-foreground">
                            {formatTime(recordingTime)}
                        </p>
                        {isPaused && (
                            <span className="text-xs text-muted-foreground">(Paused)</span>
                        )}
                    </div>
                )}

                {/* Status Message */}
                <p className="mt-2 text-xs md:text-sm text-muted-foreground text-center px-4">
                    {isTranscribing
                        ? "Processing audio..."
                        : isRecording
                            ? isPaused
                                ? "Recording paused"
                                : "Recording in progress..."
                            : "Tap the microphone to start recording"}
                </p>

                {/* Processing Indicator */}
                {isTranscribing && (
                    <div className="mt-4 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">
                            Transcribing with Backend...
                        </p>
                    </div>
                )}

                {/* Transcript Preview */}
                {transcript && (
                    <div className="mt-4 w-full">
                        <div className="p-3 bg-background border border-border rounded-md max-h-32 md:max-h-40 overflow-y-auto">
                            <p className="text-sm text-foreground whitespace-pre-wrap">
                                {transcript}
                            </p>
                        </div>
                        {transcriptionError && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRetry}
                                className="mt-2 w-full"
                                disabled={!audioBlob || isTranscribing}
                            >
                                Retry Transcription
                            </Button>
                        )}
                    </div>
                )}

                {/* Empty State */}
                {!transcript && !isRecording && !isTranscribing && (
                    <div className="mt-4 w-full p-6 border-2 border-dashed border-border rounded-md">
                        <p className="text-xs text-muted-foreground text-center">
                            Your transcribed text will appear here
                        </p>
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={handleCancel}>
                    Cancel
                </Button>
                <Button
                    size="sm"
                    onClick={handleDone}
                    disabled={!transcript.trim() || isTranscribing}
                >
                    Send
                </Button>
            </div>
        </div>
    );
}