import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

type Park = {
  ID: string
  Name: string
  State: string
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export function ParksPage() {
  const [parks, setParks] = useState<Park[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/parks`)
      .then((r) => r.json())
      .then(({ data }) => setParks(data ?? []))
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h1>Parks</h1>
      {loading && <p>Loading parks…</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {!loading && !error && (
        <ul>
          {parks.map((p) => (
            <li key={p.ID}>
              <Link to={`/park/${p.ID}`}>
                {p.Name}, {p.State}
              </Link>{' '}
              <span style={{ color: '#666' }}>({p.ID})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
