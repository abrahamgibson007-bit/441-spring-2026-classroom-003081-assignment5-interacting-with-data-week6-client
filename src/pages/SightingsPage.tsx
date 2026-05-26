import { type SubmitEvent, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

export function SightingsPage() {
  const [parkId, setParkId] = useState('')
  const [speciesId, setSpeciesId] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [notes, setNotes] = useState('')
  const [lat, setLat] = useState('')
  const [long, setLong] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    if (!supabase) return setNotice('Supabase not configured.')
    if (!parkId || !speciesId) return setNotice('Park ID and Species ID are required.')

    setBusy(true)
    setNotice(null)

    let imagePath: string | null = null

    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const fileName = `${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('SightingsImages')
        .upload(fileName, imageFile)
      if (uploadError) {
        setBusy(false)
        return setNotice(`Image upload failed: ${uploadError.message}`)
      }
      imagePath = fileName
    }

    const { error } = await supabase.from('sightings').insert({
      ParkID: parkId,
      SpeciesID: speciesId,
      DateTime: dateTime ? new Date(dateTime).toISOString() : new Date().toISOString(),
      UserID: session?.user.id ?? null,
      Notes: notes || null,
      Lat: lat ? parseFloat(lat) : null,
      Long: long ? parseFloat(long) : null,
      ImagePath: imagePath,
    })

    setBusy(false)

    if (error) {
      setNotice(`Error: ${error.message}`)
    } else {
      setNotice('Sighting submitted!')
      setParkId('')
      setSpeciesId('')
      setDateTime('')
      setNotes('')
      setLat('')
      setLong('')
      setImageFile(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  if (!supabase) {
    return (
      <div>
        <h1>Sightings</h1>
        <p>Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to <code>.env.local</code>.</p>
      </div>
    )
  }

  return (
    <div>
      <h1>Sightings</h1>
      <h2>New sighting</h2>
      {notice && <p role="status" style={{ color: notice.startsWith('Error') || notice.startsWith('Image') ? 'red' : 'green' }}>{notice}</p>}
      <form onSubmit={(e) => void handleSubmit(e)}>
        <div>
          <label htmlFor="s-park">
            Park ID{' '}
            <input id="s-park" value={parkId} onChange={(e) => setParkId(e.target.value)} disabled={busy} required />
          </label>
        </div>
        <div>
          <label htmlFor="s-species">
            Species ID{' '}
            <input id="s-species" value={speciesId} onChange={(e) => setSpeciesId(e.target.value)} disabled={busy} required />
          </label>
        </div>
        <div>
          <label htmlFor="s-when">
            Date / time{' '}
            <input id="s-when" type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} disabled={busy} />
          </label>
        </div>
        <div>
          <label htmlFor="s-notes">
            Notes{' '}
            <input id="s-notes" value={notes} onChange={(e) => setNotes(e.target.value)} disabled={busy} />
          </label>
        </div>
        <div>
          <label htmlFor="s-lat">
            Lat{' '}
            <input id="s-lat" type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} disabled={busy} />
          </label>
        </div>
        <div>
          <label htmlFor="s-long">
            Long{' '}
            <input id="s-long" type="number" step="any" value={long} onChange={(e) => setLong(e.target.value)} disabled={busy} />
          </label>
        </div>
        <div>
          <label htmlFor="s-image">
            Image{' '}
            <input
              id="s-image"
              type="file"
              accept="image/*"
              ref={fileRef}
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              disabled={busy}
            />
          </label>
        </div>
        <button type="submit" disabled={busy}>Submit</button>
      </form>
    </div>
  )
}
