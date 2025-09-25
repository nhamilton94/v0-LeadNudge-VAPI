import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/supabase-auth-provider'
import { supabase } from '@/lib/supabase/client'
import { SearchResult, SearchResults, searchConversationsAndMessages } from '@/lib/services/search-service'

interface UseSearchOptions {
  query: string
  enabled?: boolean
  limit?: number
}

interface UseSearchReturn {
  results: SearchResult[]
  isLoading: boolean
  error: string | null
  total: number
  hasMore: boolean
  loadMore: () => Promise<void>
  clearResults: () => void
}

export function useSearch({ query, enabled = true, limit = 50 }: UseSearchOptions): UseSearchReturn {
  const { user } = useAuth()
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)

  // Search function
  const performSearch = useCallback(async (searchQuery: string, searchOffset = 0, append = false) => {
    if (!user?.id || !searchQuery.trim()) {
      setResults([])
      setTotal(0)
      setHasMore(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const searchResults = await searchConversationsAndMessages({
        supabase,
        userId: user.id,
        query: searchQuery,
        limit,
        offset: searchOffset
      })

      if (append) {
        setResults(prev => [...prev, ...searchResults.results])
      } else {
        setResults(searchResults.results)
      }
      
      setTotal(searchResults.total)
      setHasMore(searchResults.hasMore)
      setOffset(searchOffset + searchResults.results.length)

    } catch (err) {
      console.error('Search error:', err)
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, limit])

  // Load more results
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return
    await performSearch(query, offset, true)
  }, [query, offset, hasMore, isLoading, performSearch])

  // Clear results
  const clearResults = useCallback(() => {
    setResults([])
    setTotal(0)
    setHasMore(false)
    setOffset(0)
    setError(null)
  }, [])

  // Perform search when query changes
  useEffect(() => {
    if (!enabled) {
      clearResults()
      return
    }

    if (!query.trim()) {
      clearResults()
      return
    }

    // Immediately clear old results to prevent showing stale data
    setResults([])
    setError(null)
    
    // Reset offset for new search
    setOffset(0)
    performSearch(query, 0, false)
  }, [query, enabled, performSearch, clearResults])

  return {
    results,
    isLoading,
    error,
    total,
    hasMore,
    loadMore,
    clearResults
  }
}