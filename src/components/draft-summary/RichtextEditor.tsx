import { EditorState } from "@tiptap/pm/state";
import type { SignoffData } from "@/providers/DraftProvider";
import Heading from "@tiptap/extension-heading";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { EditorContent, ReactNodeViewRenderer, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import HeadingNodeView from "./HeadingNodeView";
import { SelectionContext } from "./SelectionContext";
interface RichtextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onEditorReady: (editor: any) => void;
  onDocChanged?: () => void;
  isPreparing?: boolean;
  selectedSectionId?: string | null;
  onSectionSelect?: (id: string | null) => void;
  editable?: boolean;
  signoff?: SignoffData | null;
  signedBy?: string;
  isCurrent: boolean;
  voiceDisabled?: boolean;
  onOpenVoice?: (anchorElement?: HTMLElement) => void;
}
const HeadingWithId = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      "data-section-id": {
        default: null,
        parseHTML: (element) => element.getAttribute("data-section-id") ?? null,
        renderHTML: (attributes) => {
          if (!attributes["data-section-id"]) return {};
          return {
            "data-section-id": attributes["data-section-id"],
          };
        },
      },
      "data-section-position": {
        default: null,
        parseHTML: (element) =>
          element.getAttribute("data-section-position") ?? null,
        renderHTML: (attributes) => {
          if (!attributes["data-section-position"]) return {};
          return {
            "data-section-position": attributes["data-section-position"],
          };
        },
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(HeadingNodeView);
  },
});
const RichtextEditor = ({
  content,
  onChange,
  onEditorReady,
  onDocChanged,
  isPreparing = false,
  selectedSectionId = null,
  onSectionSelect = () => { },
  editable = true,
  voiceDisabled = false,
  onOpenVoice = () => { },
}: RichtextEditorProps) => {
  const editor = useEditor({
    editable: editable && !isPreparing,
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      HeadingWithId.configure({
        levels: [1, 2, 3, 4],
      }),
      Underline,
      Placeholder.configure({
        placeholder: "Capture your clinical summary...",
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
      onDocChanged?.();
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-slate max-w-none text-lg leading-relaxed text-foreground outline-none min-h-[500px] [&_li::marker]:text-foreground",
      },
    },
  });
  useEffect(() => {
    if (editor) onEditorReady(editor);
  }, [editor, onEditorReady]);
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });

      // Reset the editor state to clear undo/redo history so that
      // pressing undo after content load doesn't wipe the content.
      const newState = EditorState.create({
        doc: editor.state.doc,
        plugins: editor.state.plugins,
        selection: editor.state.selection,
      });
      editor.view.updateState(newState);
    }
  }, [content, editor]);
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editable && !isPreparing);
  }, [editor, editable, isPreparing]);
  return (
    <div className="relative w-full h-full">
      <SelectionContext.Provider
        value={{ selectedSectionId, setSelectedSectionId: onSectionSelect, voiceDisabled, onOpenVoice }}
      >
        <style>{`
          /* Heading with edit button */
          .heading-with-edit {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 12px 16px;
            margin: 0 -16px 8px -16px;
            border-radius: 8px;
            transition: all 0.25s ease;
            position: relative;
            border-left: 3px solid transparent;
          }
          
          /* Selected heading */
          .heading-with-edit.selected-section {
            background-color: rgba(99, 102, 241, 0.08);
            border-left-color: rgb(99, 102, 241);
            box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.25);
          }
          
          .heading-content {
            flex: 1;
            line-height: inherit;
          }
          
          /* Edit button (pencil icon) - ALWAYS VISIBLE */
          .heading-edit-btn {
            position: relative;
            z-index: 1;
            opacity: 0.5;
            transition: all 0.25s ease;
            background: #ffffff;
            border: 2px solid #e2e8f0;
            cursor: pointer;
            width: 34px;
            height: 34px;
            margin-top: 2px;
            border-radius: 50%;
            color: #94a3b8;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.08);
          }
          
          /* Bright animated gradient background */
          .heading-edit-btn::before {
            content: '';
            position: absolute;
            inset: -3px;
            background: conic-gradient(
              from 0deg,
              #6366F1,
              #8B5CF6,
              #A855F7,
              #C084FC,
              #E879F9,
              #F0ABFC,
              #6366F1
            );
            border-radius: 50%;
            z-index: -2;
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          
          /* White background to create ring effect */
          .heading-edit-btn::after {
            content: '';
            position: absolute;
            inset: 0;
            background: #ffffff;
            border-radius: 50%;
            z-index: -1;
          }
          
          /* Hover state - make more visible */
          .heading-edit-btn:hover {
            opacity: 1 !important;
            color: rgb(99, 102, 241);
            border-color: rgb(99, 102, 241);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
          }
          
          /* Show button more prominently on heading hover */
          .heading-with-edit:hover .heading-edit-btn {
            opacity: 0.85;
            color: #64748b;
          }
          
          /* Selected section button state - FULLY VISIBLE WITH ANIMATION */
          .heading-with-edit.selected-section .heading-edit-btn {
            opacity: 1 !important;
            color: rgb(99, 102, 241);
            border-color: transparent;
            box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
          }
          
          /* Animated gradient on selected */
          .heading-with-edit.selected-section .heading-edit-btn::before {
            opacity: 1;
            animation: rotate-gradient 2.5s linear infinite;
          }
          
          /* Highlight section content - applied via JavaScript */
          .section-content-highlighted {
            background-color: rgba(99, 102, 241, 0.04) !important;
            padding: 12px 16px !important;
            margin-left: -16px !important;
            margin-right: -16px !important;
            border-left: 3px solid rgba(99, 102, 241, 0.3) !important;
            border-radius: 0 !important;
            transition: all 0.25s ease !important;
          }
          
          /* First element after heading */
          .section-content-highlighted:first-of-type {
            margin-top: 0 !important;
          }
          
          /* Last element before next heading */
          .section-content-highlighted:last-of-type {
            margin-bottom: 16px !important;
            border-radius: 0 0 6px 6px !important;
          }
          
          @keyframes rotate-gradient {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
        {isPreparing && (
          <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ isolation: 'isolate' }}>
            <div className="absolute inset-0 bg-background/80 rounded-xl" />
            <div className="relative flex items-center gap-2 text-muted-foreground text-sm z-10">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
              Fetching summary...
            </div>
          </div>
        )}
        <EditorContent editor={editor} />
      </SelectionContext.Provider>
    </div>
  );
};
export default RichtextEditor;
