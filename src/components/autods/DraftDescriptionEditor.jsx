import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

function DraftDescriptionEditor({ editorKey, value, onChange }) {
  return (
    <div className="draft-editor__ckeditor">
      <CKEditor
        key={editorKey}
        editor={ClassicEditor}
        data={value ?? ""}
        onChange={(_event, editor) => onChange(editor.getData())}
        config={{
          toolbar: [
            "heading",
            "|",
            "bold",
            "italic",
            "link",
            "bulletedList",
            "numberedList",
            "blockQuote",
            "|",
            "undo",
            "redo",
          ],
        }}
      />
    </div>
  );
}

export default DraftDescriptionEditor;
