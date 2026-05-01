import { supabase } from './supabase'
import type { ParsedGedcom } from './gedcom'

export interface ImportProgress {
  stage: string
  current: number
  total: number
  errors: string[]
}

type ProgressCallback = (p: ImportProgress) => void

export async function importGedcomToSupabase(
  parsed: ParsedGedcom,
  onProgress: ProgressCallback
): Promise<{ peopleInserted: number, familiesInserted: number, errors: string[] }> {
  const errors: string[] = []
  const gedIdToUuid = new Map<string, string>()

  const people = Array.from(parsed.people.values())
  const families = Array.from(parsed.families.values())

  // ── STEP 1: Insert all people ──
  onProgress({ stage: 'Inserting people…', current: 0, total: people.length, errors })

  const BATCH = 50
  let peopleInserted = 0

  for (let i = 0; i < people.length; i += BATCH) {
    const batch = people.slice(i, i + BATCH)

    const rows = batch.map((p) => ({
      first_name: p.firstName,
      last_name: p.lastName,
      gender: p.gender,
      is_alive: p.isAlive,
      birth_day: p.birthDay,
      birth_month: p.birthMonth,
      birth_year: p.birthYear,
      birth_place: p.birthPlace,
      death_day: p.deathDay,
      death_month: p.deathMonth,
      death_year: p.deathYear,
      death_place: p.deathPlace,
      notes: p.notes,
      // Store gedId temporarily in location field for lookup, cleared later
      location: p.gedId,
    }))

    const { data, error } = await supabase
      .from('people')
      .insert(rows)
      .select('id, location')

    if (error) {
      errors.push(`People batch ${i}: ${error.message}`)
    } else if (data) {
      data.forEach((row: { id: string; location: string }) => {
        gedIdToUuid.set(row.location, row.id)
      })
      peopleInserted += data.length
    }

    onProgress({ stage: 'Inserting people…', current: Math.min(i + BATCH, people.length), total: people.length, errors })
  }

  // ── STEP 2: Clear temp location field ──
  onProgress({ stage: 'Cleaning up…', current: 0, total: 1, errors })
  await supabase.from('people').update({ location: null }).not('location', 'is', null)

  // ── STEP 3: Insert marriages ──
  onProgress({ stage: 'Inserting marriages…', current: 0, total: families.length, errors })

  const familyGedIdToUuid = new Map<string, string>()
  let familiesInserted = 0

  // Track marriage order per person
  const marriageOrderMap = new Map<string, number>()

  for (let i = 0; i < families.length; i += BATCH) {
    const batch = families.slice(i, i + BATCH)

    const rows = batch.map((f) => {
      const personAId = f.husbandId ? gedIdToUuid.get(f.husbandId) : null
      const personBId = f.wifeId ? gedIdToUuid.get(f.wifeId) : null

      // Calculate order for person_a
      const orderKey = personAId ?? personBId ?? 'unknown'
      const currentOrder = (marriageOrderMap.get(orderKey) ?? 0) + 1
      marriageOrderMap.set(orderKey, currentOrder)

      return {
        person_a_id: personAId ?? null,
        person_b_id: personBId ?? null,
        order_num: currentOrder,
        status: f.isDivorced ? 'divorced' : 'married',
        marriage_day: f.marriageDay,
        marriage_month: f.marriageMonth,
        marriage_year: f.marriageYear,
        marriage_place: f.marriagePlace,
        divorce_day: f.divorceDay,
        divorce_month: f.divorceMonth,
        divorce_year: f.divorceYear,
        // Store gedId in label temporarily
        label: f.gedId,
      }
    }).filter(r => r.person_a_id || r.person_b_id) // skip families with no matched people

    if (rows.length === 0) continue

    const { data, error } = await supabase
      .from('marriages')
      .insert(rows)
      .select('id, label')

    if (error) {
      errors.push(`Families batch ${i}: ${error.message}`)
    } else if (data) {
      data.forEach((row: { id: string; label: string }) => {
        familyGedIdToUuid.set(row.label, row.id)
      })
      familiesInserted += data.length
    }

    onProgress({ stage: 'Inserting marriages…', current: Math.min(i + BATCH, families.length), total: families.length, errors })
  }

  // Clear temp label field
  await supabase.from('marriages').update({ label: null }).not('label', 'like', '%').is('label', null)

  // ── STEP 4: Insert parent_child links ──
  onProgress({ stage: 'Linking children…', current: 0, total: families.length, errors })

  const parentChildRows: Array<{ marriage_id: string | null, child_id: string, birth_order: number }> = []

  for (const family of parsed.families.values()) {
    const marriageUuid = familyGedIdToUuid.get(family.gedId) ?? null

    family.childIds.forEach((childGedId, idx) => {
      const childUuid = gedIdToUuid.get(childGedId)
      if (childUuid) {
        parentChildRows.push({
          marriage_id: marriageUuid,
          child_id: childUuid,
          birth_order: idx + 1,
        })
      }
    })
  }

  // Insert parent_child in batches
  for (let i = 0; i < parentChildRows.length; i += BATCH) {
    const batch = parentChildRows.slice(i, i + BATCH)
    const { error } = await supabase.from('parent_child').insert(batch)
    if (error) errors.push(`parent_child batch ${i}: ${error.message}`)
    onProgress({ stage: 'Linking children…', current: Math.min(i + BATCH, parentChildRows.length), total: parentChildRows.length, errors })
  }

  return { peopleInserted, familiesInserted, errors }
}
