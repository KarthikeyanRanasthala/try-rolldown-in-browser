import MonacoEditor from '@monaco-editor/react'

const languageMap: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  html: 'html',
  css: 'css',
  json: 'json',
  md: 'markdown',
}

function getLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return languageMap[ext] || 'plaintext'
}

interface EditorProps {
  value: string
  onChange?: (value: string) => void
  filename: string
  readonly?: boolean
}

export function Editor({ value, onChange, filename, readonly = false }: EditorProps) {
  return (
    <MonacoEditor
      height="100%"
      language={getLanguage(filename)}
      value={value}
      onChange={(v) => onChange?.(v ?? '')}
      theme="vs-dark"
      options={{
        readOnly: readonly,
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        tabSize: 2,
        scrollBeyondLastLine: false,
        automaticLayout: true,
      }}
    />
  )
}
