import type { MarriageWithSpouse } from '@/types'
import PersonBox from '@/components/person/PersonBox'
import AddPlaceholder from '@/components/person/AddPlaceholder'
import { getDisplayName } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

interface MarriageGroupProps {
  marriage: MarriageWithSpouse
  subjectName: string
  multipleMarriages: boolean
}

export default function MarriageGroup({ marriage, subjectName, multipleMarriages }: MarriageGroupProps) {
  const { viewAs } = useAuth()
  const spouseName = marriage.spouse ? getDisplayName(marriage.spouse) : 'Unknown'
  const hasChildren = marriage.children.length > 0

  return (
    <div className="mt-6">
      {/* Group header — only shown when person has multiple marriages */}
      {multipleMarriages && (
        <div className="marriage-group-header mb-3">
          {subjectName} and {spouseName}'s children ..
        </div>
      )}

      {/* Connector line from parent to children */}
      <div className="flex flex-col items-center">
        <div style={{ width: 2, height: 32, backgroundColor: '#666' }} />

        {hasChildren ? (
          <>
            {/* Horizontal bar spanning children */}
            <div className="relative w-full flex justify-center">
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '10%',
                  right: '10%',
                  height: 2,
                  backgroundColor: '#666',
                }}
              />
            </div>

            {/* Children grid */}
            <div className="flex flex-wrap gap-3 justify-center pt-2 w-full">
              {marriage.children.map((child) => (
                <div key={child.id} className="flex flex-col items-center">
                  <div style={{ width: 2, height: 20, backgroundColor: '#666' }} />
                  <PersonBox person={child} />
                </div>
              ))}

              {/* Add son/daughter placeholders */}
              {viewAs === 'admin' && (
                <div className="add-placeholder flex flex-col items-center justify-center gap-1" style={{ minWidth: 160, minHeight: 80 }}>
                  <AddPlaceholder label="add Son" />
                  <AddPlaceholder label="add Daughter" />
                </div>
              )}
            </div>
          </>
        ) : (
          /* No children */
          <div className="flex gap-3 justify-center pt-2">
            <div
              className="add-placeholder flex flex-col items-center justify-center"
              style={{ minWidth: 200, minHeight: 80 }}
            >
              {viewAs === 'admin' ? (
                <>
                  <AddPlaceholder label="add Son" />
                  <AddPlaceholder label="add Daughter" />
                </>
              ) : (
                <span className="text-sm text-gray-400">No Children</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
