import { Link } from 'wouter'
import type { Person, MarriageWithSpouse } from '@/types'
import { formatDate, calcAge, getDisplayName } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

interface PersonBoxProps {
  person: Person
  marriages?: MarriageWithSpouse[]
  isSubject?: boolean  // the center/focus person
  showBio?: boolean
}

export default function PersonBox({ person, marriages, isSubject, showBio }: PersonBoxProps) {
  const { viewAs } = useAuth()
  const name = getDisplayName(person)
  const birthStr = formatDate(person.birth_day, person.birth_month, person.birth_year)
  const deathStr = formatDate(person.death_day, person.death_month, person.death_year)
  const age = calcAge(
    person.birth_year, person.birth_month, person.birth_day,
    person.death_year, person.death_month, person.death_day,
    person.is_alive
  )

  return (
    <div
      className="person-card relative"
      style={{ minWidth: isSubject ? 220 : 180, maxWidth: isSubject ? 280 : 220 }}
    >
      {/* Edit button (admin only) */}
      {viewAs === 'admin' && (
        <Link
          href={`/person/${person.id}/edit`}
          className="absolute top-1 right-6 text-xs"
          title="Edit"
          style={{ color: '#888', textDecoration: 'none' }}
        >
          ✏️
        </Link>
      )}

      {/* Dropdown arrow placeholder */}
      <span className="absolute top-1 right-1 text-xs text-gray-400">▽</span>

      {/* Name */}
      <div className="person-name mb-1">
        <Link href={`/view/family/${person.id}`} style={{ textDecoration: 'none' }}>
          {name}
        </Link>
      </div>

      {/* Birth */}
      {birthStr && (
        <div className="person-detail">
          b. {birthStr}{age !== null ? ` (${age} years)` : ''}
        </div>
      )}
      {person.birth_place && (
        <div className="person-detail">{person.birth_place}</div>
      )}

      {/* Death */}
      {!person.is_alive && deathStr && (
        <div className="person-detail">
          d. {deathStr}{age !== null && person.is_alive === false ? ` (aged ${age})` : ''}
        </div>
      )}
      {!person.is_alive && person.death_place && (
        <div className="person-detail">{person.death_place}</div>
      )}

      {/* Marriages (for non-subject cards, show first spouse only) */}
      {marriages && marriages.slice(0, isSubject ? undefined : 1).map((m) => (
        <div key={m.id} className="person-detail mt-0.5">
          m.{' '}
          {m.spouse ? (
            <Link href={`/view/family/${m.spouse.id}`}>
              {getDisplayName(m.spouse)}
            </Link>
          ) : (
            <span className="text-gray-400">Unknown</span>
          )}
          {m.marriage_year && (
            <div className="person-detail pl-3">
              {formatDate(m.marriage_day, m.marriage_month, m.marriage_year)}
            </div>
          )}
          {m.marriage_place && (
            <div className="person-detail pl-3">{m.marriage_place}</div>
          )}
        </div>
      ))}

      {/* Bio snippet (subject only, shown to the right separately) */}
      {showBio && person.bio && (
        <div className="person-detail mt-1 text-gray-500 italic" style={{ fontSize: 11 }}>
          {person.bio.slice(0, 120)}{person.bio.length > 120 ? '…' : ''}
        </div>
      )}
    </div>
  )
}
