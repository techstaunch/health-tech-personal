import Heading from "@tiptap/extension-heading";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

interface RichtextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onEditorReady: (editor: any) => void;
  onDocChanged?: () => void;
  isPreparing?: boolean;
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
          return { "data-section-id": attributes["data-section-id"] };
        },
      },
    };
  },
});

const RichtextEditor = ({
  content,
  onChange,
  onEditorReady,
  onDocChanged,
  isPreparing = false,
}: RichtextEditorProps) => {
  const editor = useEditor({
    editable: !isPreparing,

    extensions: [
      StarterKit.configure({
        heading: false,  
      }),
      HeadingWithId.configure({
        levels: [1, 2, 3],
      }),
      Underline,
      Placeholder.configure({
        placeholder: "Capture your clinical summary...",
      }),
    ],

    content,

    onUpdate: ({ editor }) => { 
      onChange(editor.getHTML());
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
    if (editor) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  return (
    <div className="relative w-full h-full">
      {isPreparing && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            Fetching summary...
          </div>
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
};

export default RichtextEditor;
