// src/pages/CalendarPage.jsx
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import "../styles/CalendarPage.css"

// Domingo → Sábado
const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

const DATE_FIELD = "date_start"

// Normaliza YYYY-MM-DD aunque venga con hora o UTC
function normalizeDate(dateStr) {
  return dateStr?.slice(0, 10) || ""
}

// Convierte string de fecha a Date local
function parseLocalDate(dateStr) {
  if (!dateStr) return null
  const clean = String(dateStr).slice(0, 10) // "2025-11-29"
  const [y, m, d] = clean.split("-").map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

// Para comparar días
function toDateKey(dateObj) {
  const y = dateObj.getFullYear()
  const m = String(dateObj.getMonth() + 1).padStart(2, "0")
  const d = String(dateObj.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

// Construcción del mes con Domingo como primer día
function buildMonthMatrix(monthDate) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const lastOfMonth = new Date(year, month + 1, 0)

  // getDay(): 0 = Domingo, 6 = Sábado
  const firstWeekday = firstOfMonth.getDay() // domingo = 0
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

export default function CalendarPage() {
  const navigate = useNavigate()
  const today = new Date()

  // Estado del calendario
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  )
  const [selectedDate, setSelectedDate] = useState(today)

  // Eventos
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // -------------------------------
  // CARGAR TODOS LOS EVENTOS + MINISTERIO
  // -------------------------------
  useEffect(() => {
    const loadAllEvents = async () => {
      setLoading(true)
      setError("")

      try {
        // 1) Eventos
        const { data: eventsData, error: eventsError } = await supabase
          .from("events")
          .select("*")
          .order("date_start", { ascending: true })

        if (eventsError) throw eventsError

        // 2) Ministerios
        const { data: ministriesData, error: ministriesError } = await supabase
          .from("ministries")
          .select("id, name")

        if (ministriesError) {
          console.error("Error cargando ministerios:", ministriesError)
        }

        const ministryMap = {}
        ;(ministriesData || []).forEach((m) => {
          ministryMap[m.id] = m.name
        })

        // 3) Adjuntar ministry_name a cada evento
        const eventsWithMinistry = (eventsData || []).map((ev) => ({
          ...ev,
          ministry_name: ministryMap[ev.ministry_id] || "Sin ministerio",
        }))

        setEvents(eventsWithMinistry)
      } catch (err) {
        console.error("Error cargando eventos:", err)
        setError("No se pudieron cargar los eventos.")
      } finally {
        setLoading(false)
      }
    }

    loadAllEvents()
  }, [])

  // -------------------------------
  // CALENDARIO: matriz del mes + eventos indexados por día
  // -------------------------------
  const monthMatrix = useMemo(
    () => buildMonthMatrix(currentMonth),
    [currentMonth],
  )

  const selectedKey = toDateKey(selectedDate)

  const eventsByDay = useMemo(() => {
    const map = {}

    for (const ev of events) {
      const key = normalizeDate(ev[DATE_FIELD])
      if (!key) continue

      if (!map[key]) map[key] = []
      map[key].push(ev)
    }
    return map
  }, [events])

  const eventsForSelectedDay = eventsByDay[selectedKey] || []

  // Helpers de comparación
  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  const isSameMonth = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()

  // Navegación de meses
  const goPrevMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    )
  }

  const goNextMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
    )
  }

  const handleDayClick = (day) => {
    setSelectedDate(day)
  }

  // Formato de hora
  const formatTimeRange = (ev) => {
    if (!ev.start_time && !ev.end_time) return "Todo el día"
    const format = (t) => (t ? String(t).slice(0, 5) : "")
    if (ev.start_time && ev.end_time) {
      return `${format(ev.start_time)} - ${format(ev.end_time)}`
    }
    return format(ev.start_time || ev.end_time)
  }

  // -------------------------------
  // RENDER (SOLO VISUALIZACIÓN)
  // -------------------------------
  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="calendar-page bg-white shadow rounded-lg p-4 mx-auto max-w-4xl">
        {/* BOTÓN VOLVER */}
        <button
          onClick={() => navigate("/leader")}
          className="mb-4 text-sm px-3 py-1.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 shadow-sm"
        >
          ← Volver
        </button>

        {/* HEADER DEL MES */}
        <header className="calendar-header">
          <button className="nav-btn" onClick={goPrevMonth}>
            ‹
          </button>

          <h1 className="month-title">
            {currentMonth.toLocaleDateString("es-ES", {
              month: "long",
              year: "numeric",
            })}
          </h1>

          <button className="nav-btn" onClick={goNextMonth}>
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

        {/* GRID DEL MES */}
        <div className="month-grid">
          {monthMatrix.map((week, wi) => (
            <div key={wi} className="week-row">
              {week.map((day, di) => {
                const key = toDateKey(day)
                const dayEvents = eventsByDay[key] || []
                const hasEvents = dayEvents.length > 0

                const isSelected = isSameDay(day, selectedDate)
                const inCurrentMonth = isSameMonth(day, currentMonth)
                const isToday = isSameDay(day, today)

                // Color del primer evento
                const dotColor = hasEvents
                  ? dayEvents[0].color || "#475569"
                  : null

                const cellClass = [
                  "day-cell",
                  !inCurrentMonth && "day-outside",
                  isToday && "day-today",
                  isSelected && "day-selected",
                ]
                  .filter(Boolean)
                  .join(" ")

                return (
                  <button
                    key={di}
                    className={cellClass}
                    onClick={() => handleDayClick(day)}
                  >
                    <span className="day-number">{day.getDate()}</span>

                    {hasEvents && (
                      <span
                        className="event-dot"
                        style={dotColor ? { backgroundColor: dotColor } : {}}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* ESTADO DE CARGA / ERROR */}
        {loading && (
          <p className="info-text">Cargando eventos del calendario…</p>
        )}
        {error && <p className="info-text error-text">{error}</p>}

        {/* LISTA DE EVENTOS DEL DÍA SELECCIONADO */}
        <section className="events-panel">
          <h2 className="events-title">
            Eventos para{" "}
            {selectedDate.toLocaleDateString("es-ES", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </h2>

          {!loading && eventsForSelectedDay.length === 0 ? (
            <p className="no-events">No hay eventos para este día.</p>
          ) : (
            <ul className="events-list">
              {eventsForSelectedDay.map((ev) => {
                const ministryLabel = ev.ministry_name || "Sin ministerio"
                const dateObj = parseLocalDate(ev.date_start)

                return (
                  <li key={ev.id} className="event-item">
                    <div className="event-time">{formatTimeRange(ev)}</div>
                    <div className="event-main">
                      <div className="event-title">
                        [{ministryLabel}] {ev.title || ev.name || "Sin título"}
                      </div>
                      {dateObj && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          {dateObj.toLocaleDateString("es-PA", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                        </div>
                      )}
                      {ev.description && (
                        <div className="event-description">
                          {ev.description}
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
