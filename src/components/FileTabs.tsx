import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { SourceFile } from '@/types'

interface FileTabsProps {
  files: SourceFile[]
  activeIndex: number
  onSelect: (index: number) => void
  onAdd?: (filename: string) => void
  onDelete?: (index: number) => void
  readonly?: boolean
}

export function FileTabs({
  files,
  activeIndex,
  onSelect,
  onAdd,
  onDelete,
  readonly = false,
}: FileTabsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newFilename, setNewFilename] = useState('')

  const handleAdd = () => {
    if (newFilename.trim()) {
      onAdd?.(newFilename.trim())
      setNewFilename('')
      setIsDialogOpen(false)
    }
  }

  return (
    <div className="flex items-center gap-1 bg-muted/50 px-2 py-1 overflow-x-auto">
      {files.map((file, index) => (
        <div
          key={file.filename}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 text-sm rounded-t cursor-pointer shrink-0',
            index === activeIndex
              ? 'bg-background text-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
          onClick={() => onSelect(index)}
        >
          <span>{file.filename}</span>
          {!readonly && files.length > 1 && (
            <button
              className="ml-1 hover:bg-destructive/20 rounded p-0.5"
              onClick={(e) => {
                e.stopPropagation()
                onDelete?.(index)
              }}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}
      {!readonly && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New File</DialogTitle>
              </DialogHeader>
              <Input
                placeholder="filename.js"
                value={newFilename}
                onChange={(e) => setNewFilename(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd()
                  if (e.key === 'Escape') setIsDialogOpen(false)
                }}
                autoFocus
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAdd}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}
