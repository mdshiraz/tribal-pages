// GEDCOM parser for TribalPages export format

export interface GedcomPerson {
  gedId: string
  firstName: string | null
  lastName: string | null
  nickname: string | null  // the (label) part inside /.../
  gender: 'male' | 'female' | 'unknown'
  birthDay: number | null
  birthMonth: number | null
  birthYear: number | null
  birthPlace: string | null
  deathDay: number | null
  deathMonth: number | null
  deathYear: number | null
  deathPlace: string | null
  isAlive: boolean
  notes: string | null
  familySpouseIds: string[]   // @Fxxx@ where this person is husb/wife
  familyChildIds: string[]    // @Fxxx@ where this person is a child
}

export interface GedcomFamily {
  gedId: string
  husbandId: string | null
  wifeId: string | null
  childIds: string[]
  marriageDay: number | null
  marriageMonth: number | null
  marriageYear: number | null
  marriagePlace: string | null
  divorceDay: number | null
  divorceMonth: number | null
  divorceYear: number | null
  isDivorced: boolean
}

export interface ParsedGedcom {
  people: Map<string, GedcomPerson>
  families: Map<string, GedcomFamily>
}

const MONTHS: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12
}

function parseDate(dateStr: string): { day: number | null, month: number | null, year: number | null } {
  if (!dateStr) return { day: null, month: null, year: null }
  const s = dateStr.trim().toUpperCase()

  // "May 23 2025" or "Apr 06 1964" — Month DD YYYY
  const full = s.match(/^([A-Z]{3})\s+(\d{1,2})\s+(\d{4})$/)
  if (full) {
    return { month: MONTHS[full[1]] ?? null, day: parseInt(full[2]), year: parseInt(full[3]) }
  }

  // "May 2025" — Month YYYY
  const monthYear = s.match(/^([A-Z]{3})\s+(\d{4})$/)
  if (monthYear) {
    return { month: MONTHS[monthYear[1]] ?? null, day: null, year: parseInt(monthYear[2]) }
  }

  // "2025" — year only
  const yearOnly = s.match(/^(\d{4})$/)
  if (yearOnly) {
    return { day: null, month: null, year: parseInt(yearOnly[1]) }
  }

  return { day: null, month: null, year: null }
}

function parseName(nameStr: string): { firstName: string | null, lastName: string | null, nickname: string | null } {
  // Format: "FirstName /LastName (nickname)/"
  // or: "First Middle /Last/"
  // or: "FirstName /(label)/"
  let firstName: string | null = null
  let lastName: string | null = null
  let nickname: string | null = null

  const slashMatch = nameStr.match(/^(.*?)\s*\/(.+?)\/\s*$/)
  if (slashMatch) {
    firstName = slashMatch[1].trim() || null
    const lastPart = slashMatch[2].trim()

    // Extract nickname from parens: "Anwar (Roofi)" -> lastName="Anwar", nickname="Roofi"
    const parenMatch = lastPart.match(/^(.*?)\s*\((.+?)\)\s*$/)
    if (parenMatch) {
      lastName = parenMatch[1].trim() || null
      nickname = parenMatch[2].trim() || null
    } else {
      lastName = lastPart || null
    }
  } else {
    // No slashes — treat whole thing as first name
    firstName = nameStr.trim() || null
  }

  return { firstName, lastName, nickname }
}

export function parseGedcom(content: string): ParsedGedcom {
  const lines = content.split(/\r?\n/)
  const people = new Map<string, GedcomPerson>()
  const families = new Map<string, GedcomFamily>()

  let currentPerson: GedcomPerson | null = null
  let currentFamily: GedcomFamily | null = null
  let currentContext: 'BIRT' | 'DEAT' | 'MARR' | 'DIV' | 'NOTE' | null = null
  let noteLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const match = line.match(/^(\d+)\s+(\S+)\s*(.*)?$/)
    if (!match) continue

    const level = parseInt(match[1])
    const tag = match[2].toUpperCase()
    const value = (match[3] ?? '').trim()

    // Level 0 — new record
    if (level === 0) {
      // Save note to previous person
      if (currentPerson && noteLines.length > 0) {
        currentPerson.notes = noteLines.join(' ').replace(/<br>/gi, '\n').trim()
        noteLines = []
      }

      currentContext = null
      currentPerson = null
      currentFamily = null

      // Handle: "0 @I1@ INDI" format
      const recMatch = line.match(/^0 @(.+?)@ (INDI|FAM)/)
      if (!recMatch) continue

      const gedId = `@${recMatch[1]}@`
      const recType = recMatch[2]

      if (recType === 'INDI') {
        currentPerson = {
          gedId,
          firstName: null, lastName: null, nickname: null,
          gender: 'unknown',
          birthDay: null, birthMonth: null, birthYear: null, birthPlace: null,
          deathDay: null, deathMonth: null, deathYear: null, deathPlace: null,
          isAlive: true,
          notes: null,
          familySpouseIds: [],
          familyChildIds: [],
        }
        people.set(gedId, currentPerson)
      } else if (recType === 'FAM') {
        currentFamily = {
          gedId,
          husbandId: null, wifeId: null, childIds: [],
          marriageDay: null, marriageMonth: null, marriageYear: null, marriagePlace: null,
          divorceDay: null, divorceMonth: null, divorceYear: null,
          isDivorced: false,
        }
        families.set(gedId, currentFamily)
      }
      continue
    }

    // Person fields
    if (currentPerson) {
      if (level === 1) {
        currentContext = null

        if (tag === 'NAME') {
          const { firstName, lastName, nickname } = parseName(value)
          currentPerson.firstName = firstName
          currentPerson.lastName = lastName
          currentPerson.nickname = nickname
        } else if (tag === 'SEX') {
          currentPerson.gender = value === 'M' ? 'male' : value === 'F' ? 'female' : 'unknown'
        } else if (tag === 'BIRT') {
          currentContext = 'BIRT'
        } else if (tag === 'DEAT') {
          currentPerson.isAlive = false
          currentContext = 'DEAT'
        } else if (tag === 'NOTE') {
          currentContext = 'NOTE'
          noteLines = [value]
        } else if (tag === 'FAMS') {
          const famId = value.replace(/^@|@$/g, '')
          currentPerson.familySpouseIds.push(`@${famId}@`)
        } else if (tag === 'FAMC') {
          const famId = value.replace(/^@|@$/g, '')
          currentPerson.familyChildIds.push(`@${famId}@`)
        }
      } else if (level === 2) {
        if (tag === 'DATE' && currentContext === 'BIRT') {
          const d = parseDate(value)
          currentPerson.birthDay = d.day
          currentPerson.birthMonth = d.month
          currentPerson.birthYear = d.year
        } else if (tag === 'PLAC' && currentContext === 'BIRT') {
          currentPerson.birthPlace = value || null
        } else if (tag === 'DATE' && currentContext === 'DEAT') {
          const d = parseDate(value)
          currentPerson.deathDay = d.day
          currentPerson.deathMonth = d.month
          currentPerson.deathYear = d.year
        } else if (tag === 'PLAC' && currentContext === 'DEAT') {
          currentPerson.deathPlace = value || null
        } else if (tag === 'CONC' && currentContext === 'NOTE') {
          noteLines.push(value)
        } else if (tag === 'CONT' && currentContext === 'NOTE') {
          noteLines.push('\n' + value)
        }
      }
    }

    // Family fields
    if (currentFamily) {
      if (level === 1) {
        currentContext = null
        if (tag === 'HUSB') {
          const id = value.replace(/^@|@$/g, '')
          currentFamily.husbandId = `@${id}@`
        } else if (tag === 'WIFE') {
          const id = value.replace(/^@|@$/g, '')
          currentFamily.wifeId = `@${id}@`
        } else if (tag === 'CHIL') {
          const id = value.replace(/^@|@$/g, '')
          currentFamily.childIds.push(`@${id}@`)
        } else if (tag === 'MARR') {
          currentContext = 'MARR'
        } else if (tag === 'DIV') {
          currentFamily.isDivorced = true
          currentContext = 'DIV'
        }
      } else if (level === 2) {
        if (tag === 'DATE' && currentContext === 'MARR') {
          const d = parseDate(value)
          currentFamily.marriageDay = d.day
          currentFamily.marriageMonth = d.month
          currentFamily.marriageYear = d.year
        } else if (tag === 'PLAC' && currentContext === 'MARR') {
          currentFamily.marriagePlace = value || null
        } else if (tag === 'DATE' && currentContext === 'DIV') {
          const d = parseDate(value)
          currentFamily.divorceDay = d.day
          currentFamily.divorceMonth = d.month
          currentFamily.divorceYear = d.year
        }
      }
    }
  }

  // Final person note flush
  if (currentPerson && noteLines.length > 0) {
    currentPerson.notes = noteLines.join(' ').replace(/<br>/gi, '\n').trim()
  }

  return { people, families }
}
