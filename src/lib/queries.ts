import { supabase } from './supabase'
import type { Person, Marriage, PersonWithFamily, MarriageWithSpouse } from '@/types'

export async function getAllPeople(): Promise<Person[]> {
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .order('last_name', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getPersonById(id: string): Promise<Person | null> {
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data
}

export async function getPersonWithFamily(personId: string): Promise<PersonWithFamily | null> {
  const person = await getPersonById(personId)
  if (!person) return null

  // Get all marriages where this person is person_a or person_b
  const { data: marriagesA } = await supabase
    .from('marriages')
    .select('*')
    .eq('person_a_id', personId)
    .order('order_num', { ascending: true })

  const { data: marriagesB } = await supabase
    .from('marriages')
    .select('*')
    .eq('person_b_id', personId)
    .order('order_num', { ascending: true })

  const allMarriages: Marriage[] = [
    ...(marriagesA ?? []),
    ...(marriagesB ?? []),
  ]

  // For each marriage, get spouse + children
  const marriagesWithData: MarriageWithSpouse[] = await Promise.all(
    allMarriages.map(async (marriage) => {
      const spouseId = marriage.person_a_id === personId
        ? marriage.person_b_id
        : marriage.person_a_id

      const spouse = spouseId ? await getPersonById(spouseId) : null

      // Get children for this marriage
      const { data: parentChildRows } = await supabase
        .from('parent_child')
        .select('*, child:people(*)')
        .eq('marriage_id', marriage.id)
        .order('birth_order', { ascending: true })

      const children: Person[] = (parentChildRows ?? [])
        .map((row: { child: Person }) => row.child)
        .filter(Boolean)

      return { ...marriage, spouse, children }
    })
  )

  // Get this person's own parents (find marriage where they're a child)
  const { data: parentChildRow } = await supabase
    .from('parent_child')
    .select('*, marriage:marriages(*)')
    .eq('child_id', personId)
    .maybeSingle()

  let parents: PersonWithFamily['parents'] = null

  if (parentChildRow?.marriage) {
    const parentMarriage = parentChildRow.marriage as Marriage
    const father = parentMarriage.person_a_id
      ? await getPersonById(parentMarriage.person_a_id)
      : null
    const mother = parentMarriage.person_b_id
      ? await getPersonById(parentMarriage.person_b_id)
      : null
    parents = { father, mother, marriage: parentMarriage }
  }

  return {
    ...person,
    marriages: marriagesWithData,
    parents,
  }
}

export async function getFirstPerson(): Promise<Person | null> {
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .single()
  if (error) return null
  return data
}
