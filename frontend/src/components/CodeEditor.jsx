import { useRef } from "react";

export default function CodeEditor({ value, onChange }) {
  const textareaRef = useRef(null);

  const lineCount = value.split("\n").length;

  function handleKeyDown(e) {
    if (e.key !== "Tab") return;
    e.preventDefault();

    const textarea = textareaRef.current;
    const { selectionStart, selectionEnd } = textarea;
    const next = `${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`;
    onChange(next);

    // restore cursor position after the inserted spaces
    requestAnimationFrame(() => {
      textarea.selectionStart = textarea.selectionEnd = selectionStart + 2;
    });
  }

  return (
    <div className="code-editor">
      <div className="code-editor__gutter" aria-hidden="true">
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        className="code-editor__textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck="false"
        placeholder="Write your code here..."
      />
    </div>
  );
}
