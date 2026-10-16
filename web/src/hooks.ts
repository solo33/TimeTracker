import { useEffect, useState } from 'react'

/** Текущее время, обновляется раз в секунду пока active. */
export function useNow(active = true): number {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!active) return
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [active])
  return now
}
