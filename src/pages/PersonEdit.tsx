import { useParams } from 'wouter'

export default function PersonEdit() {
  const params = useParams<{ personId: string }>()
  return (
    <div className="py-8 text-center text-muted-foreground">
      <p className="text-sm">Person edit form — coming in Phase 3.</p>
      <p className="text-xs mt-1">Person ID: {params.personId}</p>
    </div>
  )
}
