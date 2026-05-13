import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchShareStatus } from '#/lib/share'
import type { ShareStatusProbe } from '#/lib/share'

const STATUS_STALE_MS = 5 * 60 * 1000

/**
 * Probe a single share's status code, but only after the tile scrolls into
 * view. Each tile owns its own observer + query so the grid component stays
 * trivial.
 */
export function useShareStatus(shareId: string) {
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true)
            observer.disconnect()
            return
          }
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const query = useQuery<ShareStatusProbe>({
    queryKey: ['share', 'status', shareId],
    queryFn: () => fetchShareStatus(shareId),
    enabled: inView,
    staleTime: STATUS_STALE_MS,
  })

  return { ref, query }
}
