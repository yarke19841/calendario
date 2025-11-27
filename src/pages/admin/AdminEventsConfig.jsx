// src/pages/admin/AdminEventsConfig.jsx
import { useState } from "react"
import { useNavigate } from "react-router-dom"

// Helpers para fechas
function pad2(n) {
  return String(n).padStart(2, "0")
}

// YYYY-MM-DD
function toDateStr(date) {
  const y = date.getFullYear()
  const m = pad2(date.getMonth() + 1)
  const d = pad2(date.getDate())
  return `${y}-${m}-${d}`
}

// Último viernes de un mes (month: 0–11)
function getLastFriday(year, month) {
  // último día del mes
  const lastDay = new Date(year, month + 1, 0) // ej: 2025-02-28
  let d = lastDay.getDay() // 0=Dom ... 5=Vie ... 6=Sab
  const date = lastDay.getDate()

  // cuántos días retroceder para llegar a viernes (5)
  const diff = (d - 5 + 7) % 7
  return new Date(year, month, date - diff)
}

// Generar todas las fechas de jueves y sábados de un año
function getAllThursdaysAndSaturdays(year) {
  const results = []
  let current = new Date(year, 0, 1) // 1 enero
  const end = new Date(year, 11, 31) // 31 diciembre

  while (current <= end) {
    const day = current.getDay() // 0=Dom, 1=Lun,... 4=Jue, 6=Sab
    if (day === 4 || day === 6) {
      results.push(new Date(current))
    }
    current.setDate(current.getDate() + 1)
  }

  return results
}

export default function AdminEventsConfig() {
  const navigate = useNavigate()

  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)

  const [vigils, setVigils] = useState([])   // último viernes por mes
  const [fasts, setFasts] = useState([])     // todos los jueves y sábados
  const [generated, setGenerated] = useState(false)

  const handleGenerate = (e) => {
    e.preventDefault()
    const y = Number(year) || currentYear

    // 1) Vigilia: último viernes de cada mes
    const vigilsTmp = []
    for (let month = 0; month < 12; month++) {
      const d = getLastFriday(y, month)
      vigilsTmp.push({
        date: toDateStr(d),
        label: "Vigilia congregacional (último viernes del mes)",
        monthName: d.toLocaleDateString("es-PA", { month: "long" }),
      })
    }

    // 2) Ayunos: todos los jueves y sábados
    const fastDates = getAllThursdaysAndSaturdays(y).map((d) => ({
      date: toDateStr(d),
      weekday: d.toLocaleDateString("es-PA", { weekday: "long" }),
      label: "Ayuno congregacional",
    }))

    setVigils(vigilsTmp)
    setFasts(fastDates)
    setGenerated(true)
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      {/* BOTÓN VOLVER */}
      <button
        onClick={() => navigate("/admin")}
        className="mb-4 text-sm px-3 py-1.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 shadow-sm"
      >
        ← Volver
      </button>

      {/* HEADER */}
      <div className="leader-header mb-6">
        <div className="leader-avatar flex items-center justify-center bg-indigo-600 text-white font-bold text-xl">
          ⚙️
        </div>
        <div>
          <h1>Configurar eventos fijos</h1>
          <p>
            Reglas automáticas: vigilias y ayunos congregacionales para todo el año.
          </p>
        </div>
      </div>

      {/* FORM AÑO + BOTÓN */}
      <div className="premium-card mb-8">
        <form
          onSubmit={handleGenerate}
          className="flex flex-col sm:flex-row gap-4 items-start sm:items-end"
        >
          <div>
            <label className="premium-label block mb-1">
              Año a generar
            </label>
            <input
              type="number"
              className="premium-input w-32"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary">
            Calcular reglas para el año
          </button>

          {generated && (
            <span className="text-sm text-emerald-700 mt-1">
              Reglas calculadas para {year}.
            </span>
          )}
        </form>
      </div>

      {/* RESULTADOS */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Vigilia: último viernes del mes */}
        <section className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">
            Vigilias congregacionales (último viernes de cada mes)
          </h2>

          {vigils.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aún no se han calculado las fechas. Elige un año y pulsa el botón.
            </p>
          ) : (
            <ul className="text-sm space-y-2">
              {vigils.map((v, idx) => (
                <li
                  key={idx}
                  className="flex justify-between border-b last:border-b-0 pb-1"
                >
                  <span className="font-medium capitalize">
                    {v.monthName}
                  </span>
                  <span className="text-slate-600">
                    {v.date} — {v.label}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Ayunos: todos los jueves y sábados */}
        <section className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">
            Ayunos congregacionales (jueves y sábados)
          </h2>

          {fasts.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aún no se han calculado las fechas. Elige un año y pulsa el botón.
            </p>
          ) : (
            <div className="max-h-[360px] overflow-auto border rounded">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-2 py-1 text-left">Fecha</th>
                    <th className="px-2 py-1 text-left">Día</th>
                    <th className="px-2 py-1 text-left">Evento</th>
                  </tr>
                </thead>
                <tbody>
                  {fasts.map((f, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-2 py-1">{f.date}</td>
                      <td className="px-2 py-1 capitalize">
                        {f.weekday}
                      </td>
                      <td className="px-2 py-1">{f.label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
