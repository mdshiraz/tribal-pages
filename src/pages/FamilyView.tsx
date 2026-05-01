import { useParams } from 'wouter'

export default function FamilyView() {
  const params = useParams<{ personId?: string }>()

  return (
    <div>
      <div className="flex items-center gap-3 py-3 border-b border-border mb-6">
        <span className="font-medium text-sm">Family of</span>
        <select className="border border-border rounded px-2 py-1 text-sm bg-white" style={{ minWidth: 240 }}>
          <option>— select a person —</option>
        </select>
      </div>

      <div className="text-center py-16 text-muted-foreground">
        <p className="text-sm">Family view coming in Phase 2.</p>
        <p className="text-xs mt-1">Person ID: {params.personId ?? 'none'}</p>
      </div>
    </div>
  )
}
