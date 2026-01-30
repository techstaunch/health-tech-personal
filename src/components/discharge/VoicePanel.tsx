import { useState } from "react";
import { X, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoicePanelProps {
    onTranscript: (text: string) => void;
    onClose: () => void;
}

export const VoicePanel = ({ onTranscript, onClose }: VoicePanelProps) => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("");

    const toggleRecording = () => {
        setIsRecording(!isRecording);
        if (!isRecording) {
            // Simulate recording - in production, use Web Speech API
            setTranscript("");
        }
    };

    const handleDone = () => {
        if (transcript) {
            onTranscript(transcript);
        }
        onClose();
    };

    return (
        <div className="border-t border-border bg-secondary/50 p-3 md:p-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between mb-3 md:mb-4">
                <h3 className="text-sm font-semibold text-foreground">Voice Dictation</h3>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex flex-col items-center py-3 md:py-4">
                {/* Microphone Button */}
                <button
                    onClick={toggleRecording}
                    className={cn(
                        "w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all",
                        "border-2",
                        isRecording
                            ? "bg-foreground text-background border-foreground animate-pulse"
                            : "bg-background text-foreground border-border hover:border-foreground"
                    )}
                >
                    {isRecording ? (
                        <Square className="h-6 w-6 md:h-8 md:w-8" />
                    ) : (
                        <Mic className="h-6 w-6 md:h-8 md:w-8" />
                    )}
                </button>
                <p className="mt-2 md:mt-3 text-xs md:text-sm text-muted-foreground text-center px-4">
                    {isRecording ? "Recording... Tap to stop" : "Tap to start recording"}
                </p>

                {/* Transcript Preview */}
                {transcript && (
                    <div className="mt-4 w-full p-3 bg-background border border-border rounded-md">
                        <p className="text-sm text-foreground">{transcript}</p>
                    </div>
                )}

                {/* Demo input for testing */}
                <input
                    type="text"
                    placeholder="Type to simulate voice input..."
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    className="mt-4 w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
                />
            </div>

            <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={onClose}>
                    Cancel
                </Button>
                <Button size="sm" onClick={handleDone} disabled={!transcript}>
                    Insert Text
                </Button>
            </div>
        </div>
    );
}
