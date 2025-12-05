import { FileTabs } from './FileTabs'
import { Editor } from './Editor'
import type { SourceFile } from '@/types'

interface InputPanelProps {
  files: SourceFile[]
  activeIndex: number
  onSelect: (index: number) => void
  onAdd: (filename: string) => void
  onDelete: (index: number) => void
  onChange: (index: number, content: string) => void
}

export function InputPanel({
  files,
  activeIndex,
  onSelect,
  onAdd,
  onDelete,
  onChange,
}: InputPanelProps) {
  const activeFile = files[activeIndex]

  return (
    <div className="flex flex-col h-full border-b md:border-b-0 md:border-r border-border">
      <div className="text-xs font-medium px-3 py-1.5 bg-muted/30 text-muted-foreground border-b border-border">
        Input
      </div>
      <FileTabs
        files={files}
        activeIndex={activeIndex}
        onSelect={onSelect}
        onAdd={onAdd}
        onDelete={onDelete}
      />
      <div className="flex-1 min-h-0">
        {activeFile && (
          <Editor
            value={activeFile.text}
            onChange={(value) => onChange(activeIndex, value)}
            filename={activeFile.filename}
          />
        )}
      </div>
    </div>
  )
}
