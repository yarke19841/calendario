// src/pages/ExportCalendarPage.jsx
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import CalendarPage from "./CalendarPage"
import { exportToICS } from "../utils/exportICS"

const DATE_FIELD = "date_start"

function getYearFromEvent(ev) {
  const raw = ev?.[DATE_FIELD]
  if (!raw) return null
  const safe = String(raw).slice(0, 10) // "YYYY-MM-DD"
  const [y] = safe.split("-").map(Number)
  return y || null
}

export default function ExportCalendarPage() {
  const navigate = useNavigate()

  const [allEvents, setAllEvents] = useState([])
  const [selectedYear, setSelectedYear] = useState(null)

  // Cuando CalendarPage cargue los eventos, llegan aquí:
  const handleEventsLoaded = (eventsFromCalendar) => {
    console.log(
      "Eventos cargados desde el calendario:",
      eventsFromCalendar.length,
    )
    setAllEvents(eventsFromCalendar)

    // Si aún no hay año seleccionado, asignar el más reciente
    if (!selectedYear && eventsFromCalendar.length > 0) {
      const years = Array.from(
        new Set(
          eventsFromCalendar
            .map((ev) => getYearFromEvent(ev))
            .filter((y) => !!y),
        ),
      ).sort((a, b) => b - a) // desc

      if (years.length > 0) {
        setSelectedYear(years[0])
      }
    }
  }

  // Años disponibles en los eventos
  const availableYears = useMemo(() => {
    return Array.from(
      new Set(allEvents.map((ev) => getYearFromEvent(ev)).filter((y) => !!y)),
    ).sort((a, b) => b - a) // descendente
  }, [allEvents])

  // Eventos filtrados por año elegido
  const eventsForSelectedYear = useMemo(() => {
    if (!selectedYear) return []
    return allEvents.filter((ev) => getYearFromEvent(ev) === selectedYear)
  }, [allEvents, selectedYear])

  const handleExportYear = () => {
    if (!selectedYear) {
      alert("Primero selecciona un año.")
      return
    }

    if (eventsForSelectedYear.length === 0) {
      alert(`No hay eventos para el año ${selectedYear}.`)
      return
    }

    const fileName = `calendario-imj-${selectedYear}.ics`
    exportToICS(eventsForSelectedYear, fileName)
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="bg-white shadow rounded-lg p-4 mx-auto max-w-5xl space-y-4">
        {/* Volver */}
        <button
          onClick={() => navigate("/leader")}
          className="mb-2 text-sm px-3 py-1.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 shadow-sm"
        >
          ← Volver
        </button>

        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">
              Exportar calendario IMJ
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Aquí puedes exportar todos los eventos de un año completo en un
              archivo .ics para Google Calendar, iPhone, Outlook, etc.
            </p>
          </div>

          {/* Selector de año + botón exportar */}
          <div className="flex items-center gap-2">
            <select
              className="text-xs sm:text-sm border border-slate-300 rounded-md px-2 py-1 bg-white"
              value={selectedYear || ""}
              onChange={(e) =>
                setSelectedYear(
                  e.target.value ? Number(e.target.value) : null,
                )
              }
            >
              <option value="">Selecciona un año</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleExportYear}
              className="text-xs sm:text-sm px-3 py-1.5 rounded-full border border-emerald-500 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 shadow-sm"
            >
              Exportar año .ics
            </button>
          </div>
        </div>

        {/* Info de conteo */}
        <div className="text-xs text-slate-500">
          Total de eventos cargados:{" "}
          <span className="font-semibold">{allEvents.length}</span>
          {selectedYear && (
            <>
              {" "}
              · Para {selectedYear}:{" "}
              <span className="font-semibold">
                {eventsForSelectedYear.length}
              </span>
            </>
          )}
        </div>

        {/* Calendario reutilizado en modo "solo visualización / export" */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <CalendarPage
            isExportMode={true}
            onEventsLoaded={handleEventsLoaded}
          />
        </div>
      </div>
    </div>
  )
}
