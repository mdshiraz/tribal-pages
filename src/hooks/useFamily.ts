import { useQuery } from '@tanstack/react-query'
import { getAllPeople, getPersonWithFamily, getFirstPerson } from '@/lib/queries'

export function useAllPeople() {
  return useQuery({
    queryKey: ['people'],
    queryFn: getAllPeople,
  })
}

export function usePersonWithFamily(personId: string | null) {
  return useQuery({
    queryKey: ['person-family', personId],
    queryFn: () => getPersonWithFamily(personId!),
    enabled: !!personId,
  })
}

export function useFirstPerson() {
  return useQuery({
    queryKey: ['first-person'],
    queryFn: getFirstPerson,
  })
}
