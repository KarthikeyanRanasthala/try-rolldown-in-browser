import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Editor } from './Editor'
import { Preview } from './Preview'
import type { SourceFile } from '@/types'

interface OutputPanelProps {
  files: SourceFile[]
  error: string | null
}

export function OutputPanel({ files, error }: OutputPanelProps) {
  const [activeTab, setActiveTab] = useState<'preview' | number>('preview')

  return (
    <div className="flex flex-col h-full">
      <div className="text-xs font-medium px-3 py-1.5 bg-muted/30 text-muted-foreground border-b border-border">
        Output
      </div>
      <div className="flex items-center gap-1 bg-muted/50 px-2 py-1 overflow-x-auto">
        <button
          className={cn(
            'px-3 py-1.5 text-sm rounded-t shrink-0',
            activeTab === 'preview'
              ? 'bg-background text-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
          onClick={() => setActiveTab('preview')}
        >
          Preview
        </button>
        {files.map((file, index) => (
          <button
            key={file.filename}
            className={cn(
              'px-3 py-1.5 text-sm rounded-t shrink-0',
              activeTab === index
                ? 'bg-background text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
            onClick={() => setActiveTab(index)}
          >
            {file.filename}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0">
        {error ? (
          <div className="p-4 text-destructive font-mono text-sm whitespace-pre-wrap">
            {error}
          </div>
        ) : activeTab === 'preview' ? (
          <Preview files={files} />
        ) : (
          files[activeTab] && (
            <Editor
              value={files[activeTab].text}
              filename={files[activeTab].filename}
              readonly
            />
          )
        )}
      </div>
    </div>
  )
}
