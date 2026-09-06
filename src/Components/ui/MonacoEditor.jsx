import React, { useRef } from "react"
import Editor from "@monaco-editor/react"

const DCODE_THEME = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment", foreground: "3f3f46", fontStyle: "italic" },
    { token: "keyword", foreground: "ff7b72" },
    { token: "string", foreground: "a5d6ff" },
    { token: "number", foreground: "79c0ff" },
    { token: "type", foreground: "ffa657" },
    { token: "function", foreground: "d2a8ff" },
    { token: "variable", foreground: "ffa657" },
    { token: "operator", foreground: "ff7b72" },
  ],
  colors: {
    "editor.background": "#09090b",
    "editor.foreground": "#fafafa",
    "editor.lineHighlightBackground": "#0c0c0e80",
    "editor.selectionBackground": "#8b5cf630",
    "editor.inactiveSelectionBackground": "#8b5cf615",
    "editorCursor.foreground": "#8b5cf6",
    "editorWhitespace.foreground": "#27272a",
    "editorIndentGuide.background": "#27272a",
    "editorIndentGuide.activeBackground": "#3f3f46",
    "editor.lineHighlightBorder": "#00000000",
    "editorGutter.background": "#09090b",
    "editorLineNumber.foreground": "#3f3f46",
    "editorLineNumber.activeForeground": "#a1a1aa",
    "editor.selectionHighlightBackground": "#8b5cf615",
    "editorBracketMatch.background": "#8b5cf620",
    "editorBracketMatch.border": "#8b5cf650",
    "scrollbar.shadow": "#00000000",
    "scrollbarSlider.background": "#27272a40",
    "scrollbarSlider.hoverBackground": "#27272a80",
    "scrollbarSlider.activeBackground": "#3f3f46",
    "minimap.background": "#09090b",
  },
}

const MonacoEditor = ({ value, onChange, language = "javascript", onRun, onSubmit }) => {
  const editorRef = useRef(null)

  const handleMount = (editor, monaco) => {
    editorRef.current = editor

    monaco.editor.defineTheme("dcode-dark", DCODE_THEME)
    monaco.editor.setTheme("dcode-dark")

    if (onRun) {
      editor.addAction({
        id: "run-code",
        label: "Run Code",
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
        run: () => onRun(),
      })
    }

    if (onSubmit) {
      editor.addAction({
        id: "submit-code",
        label: "Submit Code",
        keybindings: [
          monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter,
        ],
        run: () => onSubmit(),
      })
    }

    editor.focus()
  }

  return (
    <div className="flex-1 overflow-hidden">
      <Editor
        height="100%"
        language={language}
        value={value}
        onChange={(v) => onChange && onChange(v || "")}
        onMount={handleMount}
        theme="dcode-dark"
        loading={
          <div className="flex items-center justify-center h-full bg-void text-text-tertiary font-mono text-xs">
            Loading editor...
          </div>
        }
        options={{
          fontSize: 13,
          fontFamily: "'JetBrains Mono', monospace",
          fontLigatures: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          padding: { top: 12, bottom: 12 },
          lineNumbers: "on",
          renderLineHighlight: "line",
          renderLineHighlightOnlyWhenFocus: false,
          smoothScrolling: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          bracketPairColorization: { enabled: true },
          guides: { bracketPairs: true },
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
          automaticLayout: true,
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
          wordBasedSuggestions: "allDocuments",
          parameterHints: { enabled: true },
          tabCompletion: "on",
          snippetSuggestions: "inline",
          scrollbar: {
            vertical: "auto",
            horizontal: "auto",
            verticalScrollbarSize: 6,
            horizontalScrollbarSize: 6,
          },
        }}
      />
    </div>
  )
}

export default MonacoEditor
