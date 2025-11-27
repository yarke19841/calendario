// src/pages/CalendarPage.jsx
import { useEffect, useMemo, useState } from "react"
import { supabase } from "../lib/supabase.js" // Ajusta la ruta si es distinta

// --- helpers de fecha ---
const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"]

function formatMonthYear(date) {
  return date.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  })
}

// YYYY-MM-DD en hora local (no UTC)
function toDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

// Construye la matriz de semanas para el mes (empezando en lunes)
function buildMonthMatrix(monthDate) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()

  const firstOfMonth = new Date(year, month, 1)
  const lastOfMonth = new Date(year, month + 1, 0)

  // JS: 0=Domingo...6=Sábado → lo movemos a 0=Lunes...6=Domingo
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

export default function CalendarPage() {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  )
  const [selectedDate, setSelectedDate] = useState(today)

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // --- cargar eventos del mes actual ---
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        setError("")

        const year = currentMonth.getFullYear()
        const month = currentMonth.getMonth()
        const monthStart = new Date(year, month, 1)
        const monthEnd = new Date(year, month + 1, 0)

        const from = toDateKey(monthStart)
        const to = toDateKey(monthEnd)

        const { data, error } = await supabase
          .from("events") // 👈 nombre de tu tabla
          .select(
            `
            id,
            title,
            description,
            event_date,
            start_time,
            end_time
          `
          ) // 👈 ajusta nombres de columnas si son diferentes
          .gte("event_date", from)
          .lte("event_date", to)
          .order("event_date", { ascending: true })
          .order("start_time", { ascending: true })

        if (error) throw error

        setEvents(data || [])
      } catch (err) {
        console.error("Error cargando eventos", err)
        setError("No se pudieron cargar los eventos del mes.")
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [currentMonth])

  // --- indexar eventos por fecha (YYYY-MM-DD) ---
  const eventsByDay = useMemo(() => {
    const map = {}
    for (const ev of events) {
      const key = ev.event_date // asumo que Supabase devuelve YYYY-MM-DD
      if (!map[key]) map[key] = []
      map[key].push(ev)
    }
    return map
  }, [events])

  const monthMatrix = useMemo(
    () => buildMonthMatrix(currentMonth),
    [currentMonth]
  )

  const selectedKey = toDateKey(selectedDate)
  const eventsForSelectedDay = eventsByDay[selectedKey] || []

  const goPrevMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    )
  }

  const goNextMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    )
  }

  const handleDayClick = (day) => {
    setSelectedDate(day)
  }

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  const isSameMonth = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()

  const formatTimeRange = (ev) => {
    if (!ev.start_time && !ev.end_time) return ""
    const format = (t) =>
      t
        ? t.slice(0, 5) // "HH:MM"
        : ""
    if (ev.start_time && ev.end_time) {
      return `${format(ev.start_time)} - ${format(ev.end_time)}`
    }
    return format(ev.start_time || ev.end_time)
  }

  return (
    <div className="calendar-page">
      {/* Header tipo iPhone */}
      <header className="calendar-header">
        <button className="nav-btn" onClick={goPrevMonth}>
          ‹
        </button>
        <h1 className="month-title">{formatMonthYear(currentMonth)}</h1>
        <button className="nav-btn" onClick={goNextMonth}>
          ›
        </button>
      </header>

      {/* Días de la semana */}
      <div className="weekday-row">
        {WEEKDAYS.map((d) => (
          <div key={d} className="weekday-cell">
            {d}
          </div>
        ))}
      </div>

      {/* Grid del mes */}
      <div className="month-grid">
        {monthMatrix.map((week, wi) => (
          <div key={wi} className="week-row">
            {week.map((day, di) => {
              const key = toDateKey(day)
              const isToday = isSameDay(day, today)
              const isSelected = isSameDay(day, selectedDate)
              const inCurrentMonth = isSameMonth(day, currentMonth)
              const hasEvents = !!eventsByDay[key]

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
                  {hasEvents && <span className="event-dot" />}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Estado de carga / error */}
      {loading && <p className="info-text">Cargando eventos…</p>}
      {error && <p className="info-text error-text">{error}</p>}

      {/* Lista de eventos del día seleccionado */}
      <section className="events-panel">
        <h2 className="events-title">
          Eventos para{" "}
          {selectedDate.toLocaleDateString("es-ES", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </h2>

        {eventsForSelectedDay.length === 0 && !loading && (
          <p className="no-events">No hay eventos para este día.</p>
        )}

        <ul className="events-list">
          {eventsForSelectedDay.map((ev) => (
            <li key={ev.id} className="event-item">
              <div className="event-time">
                {formatTimeRange(ev) || "Todo el día"}
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
      </section>
    </div>
  )
}
