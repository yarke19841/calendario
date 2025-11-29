// src/pages/admin/AdminEventsSearch.jsx
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../lib/supabase"

// Helper: calcula el rango de fechas según año/mes/día
function getRangeFromFilter({ year, month, day }) {
  if (year && month && day) {
    // Día exacto
    const d = new Date(year, month - 1, day)
    const from = d.toISOString().slice(0, 10)
    const to = from
    return { from, to, label: `Día ${from}` }
  }

  if (year && month) {
    // Mes específico
    const start = new Date(year, month - 1, 1)
    const next = new Date(year, month, 1)
    const from = start.toISOString().slice(0, 10)
    const to = next.toISOString().slice(0, 10)
    return {
      from,
      to,
      label: `Mes ${month.toString().padStart(2, "0")}/${year}`,
    }
  }

  if (year) {
    // Año completo
    const start = new Date(year, 0, 1)
    const next = new Date(year + 1, 0, 1)
    const from = start.toISOString().slice(0, 10)
    const to = next.toISOString().slice(0, 10)
    return { from, to, label: `Año ${year}` }
  }

  // Por defecto: mes actual
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const from = start.toISOString().slice(0, 10)
  const to = next.toISOString().slice(0, 10)
  const label = `Mes actual ${now.toLocaleDateString("es-PA", {
    month: "long",
    year: "numeric",
  })}`
  return { from, to, label }
}

// Formato local de fecha
function formatDateLocal(dateStr) {
  if (!dateStr) return ""
  const safe = String(dateStr).slice(0, 10)
  const [y, m, d] = safe.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("es-PA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default function AdminEventsSearch() {
  const navigate = useNavigate()

  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState("") // "" = sin filtro
  const [day, setDay] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [events, setEvents] = useState([])
  const [rangeLabel, setRangeLabel] = useState("")

  // Cargar al entrar: por defecto mes actual, máx 50 eventos
  useEffect(() => {
    handleSearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = async (e) => {
    if (e) e.preventDefault()

    setLoading(true)
    setError("")
    setEvents([])

    try {
      const { from, to, label } = getRangeFromFilter({
        year: year || null,
        month: month ? Number(month) : null,
        day: day ? Number(day) : null,
      })

      setRangeLabel(label || "")

      // 1) Eventos en el rango
      let query = supabase
        .from("events")
        .select("*")
        .gte("date_start", from)
        .lt("date_start", to === from ? to + "T23:59:59" : to)
        .order("date_start", { ascending: true })
        .limit(50) // tope para no traer infinito

      const { data: eventsData, error: eventsError } = await query

      if (eventsError) {
        console.error(eventsError)
        throw new Error("Error cargando eventos.")
      }

      // 2) Ministerios para armar etiqueta
      const { data: ministriesData, error: ministriesError } = await supabase
        .from("ministries")
        .select("id, name")

      if (ministriesError) {
        console.error(ministriesError)
      }

      const ministryMap = {}
      ;(ministriesData || []).forEach((m) => {
        ministryMap[m.id] = m.name
      })

      const enriched = (eventsData || []).map((ev) => ({
        ...ev,
        ministry_name: ev.ministry_id
          ? ministryMap[ev.ministry_id] || "Sin ministerio"
          : "General",
      }))

      setEvents(enriched)
    } catch (err) {
      setError(err.message || "Ocurrió un error al cargar eventos.")
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    const now = new Date()
    setYear(now.getFullYear())
    setMonth("")
    setDay("")
    handleSearch()
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      {/* HEADER */}
      <div className="leader-header mb-6">
        <div className="flex-1">
          <h1>Búsqueda de eventos</h1>
          <p>Filtra eventos por año, mes o día sin cargar todo el historial.</p>
        </div>

        <button
          onClick={() => navigate("/admin")}
          className="px-4 py-2 text-sm bg-white text-slate-700 rounded-full shadow hover:bg-slate-50 transition"
        >
          ← Volver
        </button>
      </div>

      {/* FILTROS */}
      <form
        onSubmit={handleSearch}
        className="bg-white rounded-xl shadow p-4 mb-6 space-y-4"
      >
        <div className="grid md:grid-cols-4 gap-4">
          {/* Año */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Año
            </label>
            <input
              type="number"
              className="premium-input"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              min="2020"
              max="2100"
            />
          </div>

          {/* Mes */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Mes (opcional)
            </label>
            <select
              className="premium-input"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              <option value="">-- Todo el año / día específico --</option>
              <option value="1">Enero</option>
              <option value="2">Febrero</option>
              <option value="3">Marzo</option>
              <option value="4">Abril</option>
              <option value="5">Mayo</option>
              <option value="6">Junio</option>
              <option value="7">Julio</option>
              <option value="8">Agosto</option>
              <option value="9">Septiembre</option>
              <option value="10">Octubre</option>
              <option value="11">Noviembre</option>
              <option value="12">Diciembre</option>
            </select>
          </div>

          {/* Día */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Día (opcional)
            </label>
            <input
              type="number"
              className="premium-input"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              min="1"
              max="31"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Si pones año + mes + día → busca ese día exacto.
            </p>
          </div>

          {/* Botones */}
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading}
            >
              {loading ? "Buscando..." : "Buscar"}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="btn-secondary"
            >
              Limpiar
            </button>
          </div>
        </div>

        {rangeLabel && (
          <p className="text-xs text-slate-500 mt-1">
            Rango aplicado: <strong>{rangeLabel}</strong> (máx. 50 eventos)
          </p>
        )}
      </form>

      {/* RESULTADOS */}
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Resultados
        </h2>

        {error && (
          <p className="text-sm text-red-500 mb-3">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">Cargando eventos...</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-slate-500">
            No se encontraron eventos para el filtro seleccionado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b">
                  <th className="py-2 pr-2">Fecha</th>
                  <th className="py-2 pr-2">Título</th>
                  <th className="py-2 pr-2">Ministerio</th>
                  <th className="py-2 pr-2">Tipo</th>
                  <th className="py-2 pr-2">Estado</th>
                  <th className="py-2 pr-2">Origen</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev.id} className="border-b last:border-0">
                    <td className="py-1.5 pr-2 text-slate-700">
                      {formatDateLocal(ev.date_start)}
                    </td>
                    <td className="py-1.5 pr-2 text-slate-800">
                      {ev.title}
                    </td>
                    <td className="py-1.5 pr-2 text-slate-500">
                      {ev.ministry_name}
                    </td>
                    <td className="py-1.5 pr-2 text-slate-500">
                      {ev.type}
                    </td>
                    <td className="py-1.5 pr-2 text-slate-500">
                      {ev.status}
                    </td>
                    <td className="py-1.5 pr-2 text-slate-500">
                      {ev.is_generated ? "Automático" : "Manual"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
