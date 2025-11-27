// src/pages/leader/LeaderEvents.jsx
import { useEffect, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../lib/supabase"
import "../../styles/CalendarPage.css" // Usa tu calendario real

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"]
const DATE_FIELD = "date_start"

// Normaliza YYYY-MM-DD aunque venga con hora o UTC
function normalizeDate(dateStr) {
  return dateStr?.slice(0, 10) || ""
}

// Para comparar días
function toDateKey(dateObj) {
  const y = dateObj.getFullYear()
  const m = String(dateObj.getMonth() + 1).padStart(2, "0")
  const d = String(dateObj.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

// Construcción del mes
function buildMonthMatrix(monthDate) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const lastOfMonth = new Date(year, month + 1, 0)

  const firstWeekday = (firstOfMonth.getDay() + 6) % 7
  const totalCells = firstWeekday + lastOfMonth.getDate()
  const weeks = Math.ceil(totalCells / 7)

  const matrix = []
  const startDate = new Date(year, month, 1 - firstWeekday)
  let current = new Date(startDate)

  for (let w = 0; w < weeks; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      week.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    matrix.push(week)
  }

  return matrix
}

export default function LeaderEvents() {
  const [leaderName, setLeaderName] = useState("")
  const [ministryName, setMinistryName] = useState("General")
  const [avatarUrl, setAvatarUrl] = useState("")

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [color, setColor] = useState("")

  const [userId, setUserId] = useState(null)
  const [ministryId, setMinistryId] = useState(null)
  const [myEvents, setMyEvents] = useState([])

  const [saving, setSaving] = useState(false)
  const [loadingList, setLoadingList] = useState(false)
  const [error, setError] = useState("")
  const [msg, setMsg] = useState("")

  // --- edición ---
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editDate, setEditDate] = useState("")
  const [editColor, setEditColor] = useState("")

  const navigate = useNavigate()

  // -------------------------------
  // CARGAR USUARIO + LEADER
  // -------------------------------
  useEffect(() => {
    const loadUserAndData = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data?.user
      if (!user) return

      setUserId(user.id)

      let displayName = ""
      let avatar = ""

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle()

      if (profile?.full_name) displayName = profile.full_name
      if (profile?.avatar_url) avatar = profile.avatar_url

      const { data: leader } = await supabase
        .from("leaders")
        .select(`
          name,
          ministry_id,
          ministries ( name )
        `)
        .eq("auth_user_id", user.id)
        .maybeSingle()

      if (leader?.name && !displayName) displayName = leader.name
      if (leader?.avatar_url) avatar = leader.avatar_url

      const mId = leader?.ministry_id ?? null
      setMinistryId(mId)

      const joinedMinistryName =
        leader?.ministries?.name || "General"

      setMinistryName(joinedMinistryName)

      setLeaderName(displayName || user.email)

      const finalAvatar =
        avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          displayName
        )}&background=6366f1&color=fff&size=128`

      setAvatarUrl(finalAvatar)

      await loadMyEvents(user.id)
    }

    loadUserAndData()
  }, [])

  // -------------------------------
  // CARGAR MIS EVENTOS
  // -------------------------------
  const loadMyEvents = async (uId) => {
    const id = uId || userId
    if (!id) return

    setLoadingList(true)

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("created_by", id)
      .eq("is_generated", false)
      .order("date_start", { ascending: true })

    setMyEvents(data || [])
    setLoadingList(false)
  }

  // -----------------------------------
  // CALENDARIO: eventos indexados por día
  // -----------------------------------
  const eventsByDay = useMemo(() => {
    const map = {}

    for (const ev of myEvents) {
      const key = normalizeDate(ev[DATE_FIELD])
      if (!key) continue

      if (!map[key]) map[key] = []
      map[key].push(ev)
    }
    return map
  }, [myEvents])

  // CALENDARIO — estados
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  )
  const [selectedDate, setSelectedDate] = useState(today)

  const monthMatrix = buildMonthMatrix(currentMonth)
  const selectedKey = toDateKey(selectedDate)
  const eventsForSelectedDay = eventsByDay[selectedKey] || []

  // -------------------------------
  // CREAR EVENTO
  // -------------------------------
  const handleSave = async (e) => {
    e.preventDefault()
    setError("")
    setMsg("")

    if (!title.trim()) return setError("El nombre del evento es obligatorio.")
    if (!eventDate) return setError("Debe seleccionar una fecha.")
    if (!userId) return setError("No se pudo identificar al usuario.")

    setSaving(true)

    try {
      const safe = eventDate // viene del input YYYY-MM-DD

      const { error } = await supabase.from("events").insert({
        title: title.trim(),
        description: description?.trim() || null,
        ministry_id: ministryId,
        type: "MINISTERIAL",
        status: "APROBADO",

        // FECHA EXACTA SIN UTC
        date_start: safe,
        date_end: safe,

        all_day: true,
        created_by: userId,
        color: color || null,
        is_generated: false,
        is_fixed: false,
      })

      if (error) throw error

      setMsg("Evento creado correctamente.")
      setTitle("")
      setDescription("")
      setEventDate("")
      setColor("")
      await loadMyEvents()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // -------------------------------
  // EDICIÓN
  // -------------------------------
  const startEdit = (ev) => {
    setEditingId(ev.id)
    setEditTitle(ev.title)
    setEditDescription(ev.description || "")
    setEditDate(normalizeDate(ev.date_start))
    setEditColor(ev.color || "")
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle("")
    setEditDescription("")
    setEditDate("")
    setEditColor("")
  }

  const handleUpdate = async (e) => {
    e.preventDefault()

    if (!editTitle.trim()) return setError("El nombre del evento es obligatorio.")
    if (!editDate) return setError("Debe seleccionar una fecha.")

    setSaving(true)

    try {
      const { error } = await supabase
        .from("events")
        .update({
          title: editTitle.trim(),
          description: editDescription.trim(),
          date_start: editDate,
          date_end: editDate,
          color: editColor,
        })
        .eq("id", editingId)

      if (error) throw error

      setMsg("Evento actualizado correctamente.")
      cancelEdit()
      await loadMyEvents()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    const ok = confirm("¿Eliminar este evento?")
    if (!ok) return

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", id)

    if (!error) {
      setMsg("Evento eliminado.")
      loadMyEvents()
    }
  }

  // -------------------------------
  // RENDER
  // -------------------------------
  return (
    <div className="min-h-screen bg-slate-100 p-6">

      {/* BOTÓN VOLVER */}
      <button
        onClick={() => navigate("/leader/home")}
        className="mb-4 text-sm px-3 py-1.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 shadow-sm"
      >
        ← Volver
      </button>

      {/* HEADER */}
      <div className="leader-header mb-6">
        <img src={avatarUrl} alt="avatar" className="leader-avatar" />
        <div>
          <h1>Mis eventos</h1>
          <p>{leaderName} • Ministerio: {ministryName}</p>
        </div>
      </div>

      {/* CALENDARIO COMPLETO */}
      <div className="calendar-page bg-white shadow rounded-lg p-4 mb-10">
        <header className="calendar-header">
          <button
            className="nav-btn"
            onClick={() =>
              setCurrentMonth(
                new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth() - 1,
                  1
                )
              )
            }
          >
            ‹
          </button>

          <h1 className="month-title">
            {currentMonth.toLocaleDateString("es-ES", {
              month: "long",
              year: "numeric",
            })}
          </h1>

          <button
            className="nav-btn"
            onClick={() =>
              setCurrentMonth(
                new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth() + 1,
                  1
                )
              )
            }
          >
            ›
          </button>
        </header>

        {/* DÍAS DE LA SEMANA */}
        <div className="weekday-row">
          {WEEKDAYS.map((d) => (
            <div key={d} className="weekday-cell">
              {d}
            </div>
          ))}
        </div>

        {/* CALENDARIO */}
        <div className="month-grid">
          {monthMatrix.map((week, wi) => (
            <div key={wi} className="week-row">
              {week.map((day, di) => {
                const key = toDateKey(day)
                const hasEvents = !!eventsByDay[key]
                const isSelected = key === selectedKey

                return (
                  <button
                    key={di}
                    className={`day-cell ${isSelected ? "day-selected" : ""}`}
                    onClick={() => setSelectedDate(day)}
                  >
                    <span className="day-number">{day.getDate()}</span>
                    {hasEvents && <span className="event-dot" />}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* LISTA DE EVENTOS DEL DÍA */}
        <section className="events-panel">
          <h2 className="events-title">
            Eventos para{" "}
            {selectedDate.toLocaleDateString("es-ES", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </h2>

          {eventsForSelectedDay.length === 0 ? (
            <p className="no-events">No hay eventos para este día.</p>
          ) : (
            <ul className="events-list">
              {eventsForSelectedDay.map((ev) => (
                <li key={ev.id} className="event-item">
                  <div className="event-time">
                    {ev.start_time?.slice(0, 5) || "Todo el día"}
                  </div>
                  <div className="event-main">
                    <div className="event-title">{ev.title}</div>
                    {ev.description && (
                      <div className="event-description">{ev.description}</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* CARD PRINCIPAL */}
      <div className="premium-card">
        <div className="grid md:grid-cols-2 gap-6">

          {/* FORMULARIO */}
          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">
              {editingId ? "Editar evento" : "Crear nuevo evento"}
            </h2>

            <form
              onSubmit={editingId ? handleUpdate : handleSave}
              className="space-y-5 text-sm"
            >
              <div>
                <label className="premium-label">Nombre del evento</label>
                <input
                  type="text"
                  className="premium-input"
                  value={editingId ? editTitle : title}
                  onChange={(e) =>
                    editingId ? setEditTitle(e.target.value) : setTitle(e.target.value)
                  }
                  placeholder="Ej: Reunión de líderes"
                />
              </div>

              <div>
                <label className="premium-label">Descripción</label>
                <textarea
                  className="premium-input"
                  rows="3"
                  value={editingId ? editDescription : description}
                  onChange={(e) =>
                    editingId
                      ? setEditDescription(e.target.value)
                      : setDescription(e.target.value)
                  }
                />
              </div>

              <div>
                <label className="premium-label">Fecha</label>
                <input
                  type="date"
                  className="premium-input"
                  value={editingId ? editDate : eventDate}
                  onChange={(e) =>
                    editingId
                      ? setEditDate(e.target.value)
                      : setEventDate(e.target.value)
                  }
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button className="btn-primary flex-1">
                  {saving
                    ? "Guardando..."
                    : editingId
                    ? "Guardar cambios"
                    : "Crear evento"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* LISTA DE EVENTOS */}
          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">
              Mis eventos
            </h2>

            {loadingList ? (
              <p className="text-sm text-slate-500">Cargando eventos...</p>
            ) : myEvents.length === 0 ? (
              <p className="text-sm text-slate-500">
                Aún no has creado eventos.
              </p>
            ) : (
              <ul className="divide-y divide-slate-200 text-sm max-h-[380px] overflow-auto">
                {myEvents.map((ev) => (
                  <li key={ev.id} className="event-item">
                    <div className="event-date">
                      <div className="event-date-day">
                        {new Date(ev.date_start).getDate()}
                      </div>
                      <div className="event-date-month">
                        {new Date(ev.date_start).toLocaleString("es-PA", {
                          month: "short",
                        })}
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="event-title">
                        [{ministryName}] {ev.title}
                      </div>

                      {ev.description && (
                        <div className="text-xs text-slate-500 mt-1">
                          {ev.description}
                        </div>
                      )}

                      <div className="event-actions">
                        <button
                          className="btn-table btn-edit"
                          onClick={() => startEdit(ev)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn-table btn-delete"
                          onClick={() => handleDelete(ev.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
