import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

type Sighting = {
  id: number
  DateTime: string
  ParkID: string
  SpeciesID: string
  UserID: string
  Notes: string | null
  Lat: number | null
  Long: number | null
  ImagePath: string | null
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? ''

function imageUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/SightingsImages/${path}`
}

export function ParkDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [sightings, setSightings] = useState<Sighting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [since, setSince] = useState('')
  const [before, setBefore] = useState('')

  function fetchSightings() {
    if (!id) return
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ park: id })
    if (since) params.set('since', since)
    if (before) params.set('before', before)
    fetch(`${API_URL}/sightings?${params}`)
      .then((r) => r.json())
      .then(({ data }) => setSightings(data ?? []))
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchSightings()
  }, [id])

  function handleFilter(e: React.FormEvent) {
    e.preventDefault()
    fetchSightings()
  }

  return (
    <div>
      <h1>Park: {id}</h1>

      <h2>Filter sightings</h2>
      <form onSubmit={handleFilter} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <label>
          After{' '}
          <input
            type="datetime-local"
            value={since}
            onChange={(e) => setSince(e.target.value)}
          />
        </label>
        <label>
          Before{' '}
          <input
            type="datetime-local"
            value={before}
            onChange={(e) => setBefore(e.target.value)}
          />
        </label>
        <button type="submit">Apply</button>
        <button
          type="button"
          onClick={() => { setSince(''); setBefore(''); }}
        >
          Clear
        </button>
      </form>

      <h2>Sightings</h2>
      {loading && <p>Loading…</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {!loading && !error && sightings.length === 0 && <p>No sightings found.</p>}
      {!loading && !error && sightings.length > 0 && (
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              {['ID', 'DateTime', 'ParkID', 'SpeciesID', 'UserID', 'Notes', 'Lat', 'Long', 'Image'].map((h) => (
                <th key={h} style={{ border: '1px solid #ccc', padding: '4px 8px', textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sightings.map((s) => (
              <tr key={s.id}>
                <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>{s.id}</td>
                <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>
                  {s.DateTime ? new Date(s.DateTime).toLocaleString() : '—'}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>{s.ParkID ?? '—'}</td>
                <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>{s.SpeciesID ?? '—'}</td>
                <td style={{ border: '1px solid #ccc', padding: '4px 8px', fontSize: '0.75rem' }}>
                  {s.UserID ? s.UserID.slice(0, 8) + '…' : '—'}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>{s.Notes ?? '—'}</td>
                <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>{s.Lat ?? '—'}</td>
                <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>{s.Long ?? '—'}</td>
                <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>
                  {s.ImagePath
                    ? <img src={imageUrl(s.ImagePath)} alt="sighting" style={{ maxWidth: 80, maxHeight: 80 }} />
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
