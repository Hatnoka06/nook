import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/types'
import { useSession } from './AuthProvider'

export function useProfile() {
  const session = useSession()
  const uid = session?.user.id
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: ['profile', uid],
    enabled: Boolean(uid),
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', uid!).maybeSingle()
      if (error) throw error
      if (data) return data as Profile
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      const { data: created, error: e2 } = await supabase.from('profiles').insert({ id: uid, time_zone: tz }).select().single()
      if (e2) throw e2
      return created as Profile
    },
  })
  const update = useMutation({
    mutationFn: async (patch: Partial<Profile>) => {
      const { error } = await supabase.from('profiles').update(patch).eq('id', uid!)
      if (error) throw error
    },
    onMutate: async (patch) => {
      const prev = qc.getQueryData<Profile>(['profile', uid])
      if (prev) qc.setQueryData(['profile', uid], { ...prev, ...patch })
      return { prev }
    },
    onError: (_e, _p, ctx) => { if (ctx?.prev) qc.setQueryData(['profile', uid], ctx.prev) },
  })
  return { profile: query.data, isLoading: query.isLoading, error: query.error, update: update.mutateAsync }
}
