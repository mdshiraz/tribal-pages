import { useState, useCallback } from 'react'
import { parseGedcom, type ParsedGedcom } from '@/lib/gedcom'
import { importGedcomToSupabase, type ImportProgress } from '@/lib/gedcomImporter'
import { useAuth } from '@/hooks/useAuth'
import { Redirect } from 'wouter'

type Stage = 'upload' | 'preview' | 'importing' | 'done' | 'error'

export default function GedcomImport() {
  const { viewAs } = useAuth()
  const [stage, setStage] = useState<Stage>('upload')
  const [parsed, setParsed] = useState<ParsedGedcom | null>(null)
  const [fileName, setFileName] = useState('')
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const [result, setResult] = useState<{ peopleInserted: number, familiesInserted: number, errors: string[] } | null>(null)
  const [dragOver, setDragOver] = useState(false)

  if (viewAs !== 'admin') return <Redirect to="/view/family" />

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.ged') && !file.name.endsWith('.GED')) {
      alert('Please upload a .ged file')
      return
    }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const result = parseGedcom(content)
      setParsed(result)
      setStage('preview')
    }
    reader.readAsText(file, 'UTF-8')
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleImport = async () => {
    if (!parsed) return
    setStage('importing')
    try {
      const res = await importGedcomToSupabase(parsed, (p) => setProgress(p))
      setResult(res)
      setStage('done')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setResult({ peopleInserted: 0, familiesInserted: 0, errors: [message] })
      setStage('error')
    }
  }

  // Sample people for preview
  const samplePeople = parsed ? Array.from(parsed.people.values()).slice(0, 8) : []

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-xl font-bold mb-1">Import GEDCOM</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Upload a .ged file exported from TribalPages or any genealogy software.
      </p>

      {/* Upload stage */}
      {stage === 'upload' && (
        <div
          className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer transition-colors"
          style={{ backgroundColor: dragOver ? '#f0ede4' : 'white' }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('ged-input')?.click()}
        >
          <div className="text-4xl mb-3">📁</div>
          <p className="font-medium text-sm">Drop your .ged file here</p>
          <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
          <input
            id="ged-input"
            type="file"
            accept=".ged,.GED"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      )}

      {/* Preview stage */}
      {stage === 'preview' && parsed && (
        <div>
          <div className="bg-white border border-border rounded p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">{fileName}</span>
              <span className="text-xs text-muted-foreground">Parsed successfully</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center p-3 bg-background rounded">
                <div className="text-2xl font-bold" style={{ color: 'hsl(var(--primary))' }}>
                  {parsed.people.size.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">People</div>
              </div>
              <div className="text-center p-3 bg-background rounded">
                <div className="text-2xl font-bold" style={{ color: 'hsl(var(--primary))' }}>
                  {parsed.families.size.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Families</div>
              </div>
            </div>
          </div>

          {/* Sample preview */}
          <div className="bg-white border border-border rounded mb-4">
            <div className="px-4 py-2 border-b border-border text-xs font-medium text-muted-foreground">
              Sample — first 8 people
            </div>
            <div className="divide-y divide-border">
              {samplePeople.map((p) => (
                <div key={p.gedId} className="px-4 py-2 text-sm flex items-center justify-between">
                  <span>
                    {[p.firstName, p.lastName].filter(Boolean).join(' ') || '(unnamed)'}
                    {p.nickname && <span className="text-muted-foreground ml-1">({p.nickname})</span>}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {p.gender === 'male' ? '♂' : p.gender === 'female' ? '♀' : '?'}
                    {p.birthYear ? ` b.${p.birthYear}` : ''}
                    {!p.isAlive ? ` d.${p.deathYear ?? '?'}` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4 text-xs text-amber-800">
            ⚠️ This will insert all records into your Supabase database. If you've imported before, you may get duplicates. Best to run on a fresh/empty database.
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleImport}
              className="px-6 py-2 rounded text-sm font-medium text-white"
              style={{ backgroundColor: 'hsl(var(--primary))' }}
            >
              Import {parsed.people.size.toLocaleString()} people
            </button>
            <button
              onClick={() => { setStage('upload'); setParsed(null) }}
              className="px-4 py-2 rounded text-sm border border-border bg-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Importing stage */}
      {stage === 'importing' && progress && (
        <div className="bg-white border border-border rounded p-6">
          <div className="text-sm font-medium mb-2">{progress.stage}</div>
          <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                backgroundColor: 'hsl(var(--primary))'
              }}
            />
          </div>
          <div className="text-xs text-muted-foreground">
            {progress.current} / {progress.total}
          </div>
          {progress.errors.length > 0 && (
            <div className="mt-3 text-xs text-red-600">{progress.errors.slice(-3).join(', ')}</div>
          )}
        </div>
      )}

      {/* Done stage */}
      {stage === 'done' && result && (
        <div className="bg-white border border-border rounded p-6 text-center">
          <div className="text-4xl mb-3">✅</div>
          <h2 className="font-bold text-lg mb-1">Import Complete!</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {result.peopleInserted.toLocaleString()} people and {result.familiesInserted.toLocaleString()} marriages added to your tree.
          </p>
          {result.errors.length > 0 && (
            <div className="text-xs text-amber-700 bg-amber-50 rounded p-2 mb-4">
              {result.errors.length} minor errors (partial data may be missing)
            </div>
          )}
          <a
            href="/view/family"
            className="inline-block px-6 py-2 rounded text-sm font-medium text-white"
            style={{ backgroundColor: 'hsl(var(--primary))' }}
          >
            View Family Tree →
          </a>
        </div>
      )}

      {/* Error stage */}
      {stage === 'error' && result && (
        <div className="bg-white border border-red-200 rounded p-6 text-center">
          <div className="text-4xl mb-3">❌</div>
          <h2 className="font-bold text-lg mb-2">Import Failed</h2>
          <div className="text-xs text-red-600 text-left bg-red-50 rounded p-3 mb-4">
            {result.errors.map((e, i) => <div key={i}>{e}</div>)}
          </div>
          <button
            onClick={() => setStage('upload')}
            className="px-4 py-2 rounded text-sm border border-border"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}
