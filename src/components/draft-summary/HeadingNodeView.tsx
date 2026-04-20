import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import { Pencil } from "lucide-react";
import { useSelection } from "./SelectionContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useEffect, useRef } from "react";
const HeadingNodeView = ({ node }: { node: any }) => {
    const level = node.attrs.level || 3;
    const sectionId = node.attrs["data-section-id"];
    const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
    const { selectedSectionId, setSelectedSectionId, voiceDisabled, onOpenVoice } = useSelection();
    const isSelected = selectedSectionId === sectionId;
    const wrapperRef = useRef<HTMLElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const handleEditClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Use section ID if available, otherwise use heading text as identifier
        const identifier = sectionId || node.textContent || `heading-${level}`;
        // Toggle: clicking the pencil on an already-selected section deselects it
        if (isSelected) {
            setSelectedSectionId(null);
            return;
        }
        setSelectedSectionId(identifier);
        // Open voice panel next to this button
        if (onOpenVoice && buttonRef.current) {
            onOpenVoice(buttonRef.current);
        }
    };
    // Highlight all content between this heading and the next heading
    useEffect(() => {
        if (!wrapperRef.current) return;
        const headingElement = wrapperRef.current;
        const identifier = sectionId || node.textContent || `heading-${level}`;
        // Try to find the editor container
        const editorContainer = headingElement.closest('.ProseMirror');
        if (!editorContainer) {
            console.log('Editor container not found');
            return;
        }
        const allElements: Element[] = [];
        let foundHeading = false;
        // Iterate through all children of the editor
        const children = Array.from(editorContainer.children);
        for (const child of children) {
            // Find our heading first
            if (child === headingElement) {
                foundHeading = true;
                continue;
            }
            // After finding our heading, collect elements until next heading
            if (foundHeading) {
                if (child.tagName.match(/^H[1-6]$/)) {
                    // Stop at next heading
                    break;
                }
                allElements.push(child);
            }
        }
        console.log('Identifier:', identifier, 'Elements found:', allElements.length);
        // Apply or remove highlight class
        if (isSelected) {
            allElements.forEach(el => {
                el.classList.add('section-content-highlighted');
            });
        } else {
            allElements.forEach(el => {
                el.classList.remove('section-content-highlighted');
            });
        }
        // Cleanup
        return () => {
            allElements.forEach(el => el.classList.remove('section-content-highlighted'));
        };
    }, [isSelected, sectionId, node.textContent, level]);
    return (
        <NodeViewWrapper
            as={Tag}
            ref={wrapperRef}
            data-section-id={sectionId ?? undefined}
            className={`heading-with-edit ${isSelected ? "selected-section" : ""}`}
        >
            <NodeViewContent as={"span" as any} className="heading-content" />
            {!voiceDisabled && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            ref={buttonRef}
                            type="button"
                            contentEditable={false}
                            suppressContentEditableWarning
                            className="heading-edit-btn"
                            onClick={handleEditClick}
                            aria-label={`Edit section`}
                        >
                            <Pencil size={16} />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-popover text-popover-foreground border shadow-md">
                        {isSelected
                            ? "AI editing enabled for this section"
                            : "Click to select and use AI on this section"}
                    </TooltipContent>
                </Tooltip>
            )}
        </NodeViewWrapper>
    );
};
export default HeadingNodeView;