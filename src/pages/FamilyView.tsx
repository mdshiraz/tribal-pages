import { useParams, useLocation } from 'wouter'
import { useEffect, useState } from 'react'
import { useAllPeople, usePersonWithFamily, useFirstPerson } from '@/hooks/useFamily'
import PersonBox from '@/components/person/PersonBox'
import AddPlaceholder from '@/components/person/AddPlaceholder'
import MarriageGroup from '@/components/family/MarriageGroup'
import { getDisplayName, formatDate, calcAge } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

export default function FamilyView() {
  const params = useParams<{ personId?: string }>()
  const [, setLocation] = useLocation()
  const { viewAs } = useAuth()

  const { data: allPeople = [] } = useAllPeople()
  const { data: firstPerson } = useFirstPerson()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (params.personId) {
      setSelectedId(params.personId)
    } else if (firstPerson) {
      setSelectedId(firstPerson.id)
    }
  }, [params.personId, firstPerson])

  const { data: personData, isLoading } = usePersonWithFamily(selectedId)

  const handlePersonSelect = (id: string) => {
    setSelectedId(id)
    setLocation(`/view/family/${id}`)
  }

  const subjectName = personData ? getDisplayName(personData) : ''

  return (
    <div>
      {/* Family of dropdown */}
      <div className="flex items-center gap-3 py-3 border-b border-border mb-6">
        <span className="font-medium text-sm">Family of</span>
        <select
          className="border border-border rounded px-2 py-1 text-sm bg-white"
          style={{ minWidth: 260 }}
          value={selectedId ?? ''}
          onChange={(e) => handlePersonSelect(e.target.value)}
        >
          <option value="">— select a person —</option>
          {allPeople.map((p) => (
            <option key={p.id} value={p.id}>
              {getDisplayName(p)}{p.birth_year ? ` (b.${p.birth_year})` : ''}
            </option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="text-center py-16 text-sm text-muted-foreground">Loading...</div>
      )}

      {!isLoading && !personData && allPeople.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground mb-4">No people in the tree yet.</p>
          {viewAs === 'admin' && (
            <a href="/person/new/edit" style={{ color: 'hsl(var(--primary))' }} className="text-sm font-medium">
              + Add the first person
            </a>
          )}
        </div>
      )}

      {!isLoading && personData && (
        <div className="family-view">

          {/* GRANDPARENTS ROW */}
          <div className="flex justify-center gap-8 mb-0">
            {personData.parents ? (
              <>
                <div className="flex flex-col items-center">
                  {personData.parents.father
                    ? <PersonBox person={personData.parents.father} marriages={[]} />
                    : viewAs === 'admin' && <AddPlaceholder label="add Father" />
                  }
                </div>
                <div className="flex items-center">
                  <div style={{ width: 40, height: 2, backgroundColor: '#666', marginTop: 40 }} />
                </div>
                <div className="flex flex-col items-center">
                  {personData.parents.mother
                    ? <PersonBox person={personData.parents.mother} marriages={[]} />
                    : viewAs === 'admin' && <AddPlaceholder label="add Mother" />
                  }
                </div>
              </>
            ) : (
              viewAs === 'admin' && (
                <div className="flex gap-8 items-center">
                  <AddPlaceholder label="add Father" />
                  <div style={{ width: 40, height: 2, backgroundColor: '#999' }} />
                  <AddPlaceholder label="add Mother" />
                </div>
              )
            )}
          </div>

          {/* Vertical connector down to subject */}
          {(personData.parents || viewAs === 'admin') && (
            <div className="flex justify-center">
              <div style={{ width: 2, height: 36, backgroundColor: '#666' }} />
            </div>
          )}

          {/* SUBJECT ROW */}
          <div className="flex justify-center gap-6 items-start">
            {/* Photo placeholder */}
            <div className="flex flex-col items-center pt-2" style={{ width: 80 }}>
              <div
                style={{
                  width: 72, height: 72,
                  backgroundColor: '#e8e0cc',
                  border: '1px solid #ccc',
                  borderRadius: 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28,
                }}
              >📷</div>
              <div className="text-xs mt-1" style={{ color: 'hsl(var(--primary))' }}>add photos</div>
            </div>

            {/* Subject card */}
            <div style={{ minWidth: 240 }}>
              <div className="flex items-center gap-2 mb-1">
                <span style={{ fontSize: 14, color: '#888' }}>⛓️</span>
                {viewAs === 'admin' && (
                  <a href={`/person/${personData.id}/edit`} style={{ fontSize: 14, color: '#888', textDecoration: 'none' }}>✏️</a>
                )}
                <h2 className="text-lg font-bold" style={{ color: '#000' }}>{subjectName}</h2>
              </div>

              {personData.birth_year && (
                <div className="person-detail">
                  b. {formatDate(personData.birth_day, personData.birth_month, personData.birth_year)}
                  {calcAge(personData.birth_year, personData.birth_month, personData.birth_day,
                    personData.death_year, personData.death_month, personData.death_day, personData.is_alive) !== null && (
                    <span> ({calcAge(personData.birth_year, personData.birth_month, personData.birth_day,
                      personData.death_year, personData.death_month, personData.death_day, personData.is_alive)} years)</span>
                  )}
                </div>
              )}
              {personData.birth_place && <div className="person-detail">{personData.birth_place}</div>}
              {!personData.is_alive && personData.death_year && (
                <div className="person-detail">
                  d. {formatDate(personData.death_day, personData.death_month, personData.death_year)}
                </div>
              )}
              {!personData.is_alive && personData.death_place && (
                <div className="person-detail">{personData.death_place}</div>
              )}

              {personData.marriages.map((m) => (
                <div key={m.id} className="person-detail mt-1">
                  m.{' '}
                  {m.spouse ? (
                    <a href={`/view/family/${m.spouse.id}`} style={{ color: 'hsl(var(--primary))' }}>
                      {getDisplayName(m.spouse)}
                    </a>
                  ) : <span className="text-gray-400">Unknown</span>}
                  {m.marriage_year && <div className="pl-3 person-detail">{formatDate(m.marriage_day, m.marriage_month, m.marriage_year)}</div>}
                  {m.marriage_place && <div className="pl-3 person-detail">{m.marriage_place}</div>}
                </div>
              ))}

              {viewAs === 'admin' && (
                <div className="person-detail mt-1">
                  m. «&nbsp;<a href="#" style={{ color: 'hsl(var(--primary))' }}>add spouse/partner</a>&nbsp;»
                </div>
              )}
            </div>

            {/* Bio panel */}
            {personData.bio && (
              <div className="bg-white border border-border rounded p-3" style={{ maxWidth: 280, fontSize: 12, lineHeight: 1.6 }}>
                {personData.bio.slice(0, 400)}
                {personData.bio.length > 400 && <span style={{ color: 'hsl(var(--primary))' }}> …more</span>}
              </div>
            )}
          </div>

          {/* CHILDREN BY MARRIAGE */}
          {personData.marriages.length > 0 && (
            <div className="mt-2">
              {personData.marriages.map((marriage) => (
                <MarriageGroup
                  key={marriage.id}
                  marriage={marriage}
                  subjectName={subjectName}
                  multipleMarriages={personData.marriages.length > 1}
                />
              ))}
            </div>
          )}

          {personData.marriages.length === 0 && viewAs === 'admin' && (
            <div className="flex justify-center mt-8">
              <div className="add-placeholder">
                «&nbsp;<a href="#" style={{ color: 'hsl(var(--primary))' }}>add spouse/partner</a>&nbsp;»
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 text-center text-xs text-muted-foreground border-t border-border pt-3">
        Click the ▽ icon to edit information, add spouse, parents, children and other options.
      </div>
    </div>
  )
}
