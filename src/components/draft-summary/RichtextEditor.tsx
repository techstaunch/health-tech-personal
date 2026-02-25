import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

interface RichtextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onEditorReady: (editor: any) => void;
}

const RichtextEditor = ({
  content,
  onChange,
  onEditorReady,
}: RichtextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Placeholder.configure({
        placeholder: "Capture your clinical summary...",
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
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
    <div className="w-full h-full">
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichtextEditor;
