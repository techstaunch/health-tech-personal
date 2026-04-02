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
    }
  }, [content, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editable && !isPreparing);
  }, [editor, editable, isPreparing]);

  return (
    <div className="relative w-full h-full">
      <SelectionContext.Provider
        value={{ selectedSectionId, setSelectedSectionId: onSectionSelect, voiceDisabled }}
      >
        <style>{`
          .heading-with-edit {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 8px 12px;
            margin: -8px -12px;
            border-radius: 8px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
          }
          .heading-with-edit.selected-section {
            background-color: var(--accent, rgba(155, 114, 203, 0.05));
            box-shadow: 0 0 0 1px var(--primary, rgba(155, 114, 203, 0.2));
          }
          .heading-content {
            flex: 1;
            line-height: inherit;
          }
          .heading-edit-btn {
            position: relative;
            z-index: 1;
            opacity: 0.3;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            background: var(--background, #fff);
            border: 1px solid var(--border, #e2e8f0);
            cursor: pointer;
            width: 32px;
            height: 32px;
            margin-top: 2px;
            border-radius: 50%;
            color: var(--muted-foreground, #64748b);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            box-shadow: 0 1px 2px rgba(0,0,0,0.08);
          }
          .heading-edit-btn::before {
            content: '';
            position: absolute;
            inset: -2px;
            background: conic-gradient(
              from 0deg,
              #4285F4,
              #9B72CB,
              #D96570,
              #F48120,
              #4285F4
            );
            border-radius: 50%;
            z-index: -2;
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          .heading-edit-btn::after {
            content: '';
            position: absolute;
            inset: 0;
            background: var(--background, #fff);
            border-radius: 50%;
            z-index: -1;
          }
          .heading-edit-btn:hover {
            opacity: 1;
            color: var(--foreground, #333);
            border-color: var(--primary, #9B72CB);
            transform: scale(1.1);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          .heading-with-edit:hover .heading-edit-btn {
            opacity: 1;
          }
          .heading-with-edit.selected-section .heading-edit-btn::before {
            opacity: 1;
            animation: rotate-ai 3s linear infinite;
            filter: blur(4px);
          }
          .heading-with-edit.selected-section .heading-edit-btn {
            opacity: 1;
            color: var(--primary, #9B72CB);
            border-color: transparent;
            animation: pulse-ai 2s infinite ease-in-out;
            box-shadow: 0 0 15px var(--primary, rgba(155, 114, 203, 0.4));
          }
          @keyframes rotate-ai {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulse-ai {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
        `}</style>

        {isPreparing && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
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
