import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
  type QueryKey,
  type QueryClient,
} from '@tanstack/react-query'
import { apiCall } from './index'

// ─── useApiQuery ───────────────────────────────────
// Wraps useQuery with apiCall — auto token, auto refresh, typed
export function useApiQuery<TData = any>(
  queryKey: QueryKey,
  endpoint: string,
  options?: Omit<UseQueryOptions<TData, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<TData, Error>({
    queryKey,
    queryFn: () => apiCall<TData>(endpoint),
    ...options,
  })
}

// ─── useApiMutation ────────────────────────────────
// Wraps useMutation with apiCall — typed body & response
export function useApiMutation<TData = any, TBody = any>(
  endpoint: string | ((variables: TBody) => string),
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE' = 'POST',
  options?: Omit<UseMutationOptions<TData, Error, TBody>, 'mutationFn'>,
) {
  return useMutation<TData, Error, TBody>({
    mutationFn: (body: TBody) => {
      const url = typeof endpoint === 'function' ? endpoint(body) : endpoint
      return apiCall<TData>(url, {
        method,
        ...(method !== 'DELETE' ? { body: JSON.stringify(body) } : {}),
      })
    },
    ...options,
  })
}

// ─── useOptimisticMutation ─────────────────────────
// Full optimistic update pattern with rollback
export function useOptimisticMutation<TData = any, TBody = any, TCached = any>(config: {
  endpoint: string | ((variables: TBody) => string)
  method?: 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  /** Query key to optimistically update */
  queryKey: QueryKey
  /** Transform cached data optimistically before server responds */
  updater: (oldData: TCached | undefined, variables: TBody) => TCached
  /** Additional keys to invalidate after mutation settles */
  invalidateKeys?: QueryKey[]
}) {
  const queryClient = useQueryClient()
  const { endpoint, method = 'PATCH', queryKey, updater, invalidateKeys } = config

  return useMutation<TData, Error, TBody, { previous: TCached | undefined }>({
    mutationFn: (body: TBody) => {
      const url = typeof endpoint === 'function' ? endpoint(body) : endpoint
      return apiCall<TData>(url, {
        method,
        ...(method !== 'DELETE' ? { body: JSON.stringify(body) } : {}),
      })
    },

    async onMutate(variables) {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey })

      // Snapshot previous value for rollback
      const previous = queryClient.getQueryData<TCached>(queryKey)

      // Optimistically update cache
      queryClient.setQueryData<TCached>(queryKey, old => updater(old, variables))

      return { previous }
    },

    onError(_err, _variables, context) {
      // Rollback to previous value on error
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKey, context.previous)
      }
    },

    onSettled() {
      // Refetch to ensure server state
      queryClient.invalidateQueries({ queryKey })
      invalidateKeys?.forEach(key =>
        queryClient.invalidateQueries({ queryKey: key }),
      )
    },
  })
}
