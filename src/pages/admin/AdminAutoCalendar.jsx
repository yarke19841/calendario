// src/pages/admin/AdminAutoCalendar.jsx
import { useState } from "react"
import { supabase } from "../../lib/supabase"
import { generateAutoEventsForYear } from "../../utils/generateAutoEvents"


export default function AdminAutoCalendar() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const handleGenerate = async () => {
    setError("")
    setMessage("")
    

    try {
      setLoading(true)

      // 0️⃣ Usuario actual (para created_by)
    const { data: userData, error: userError } = await supabase.auth.getUser()
if (userError) {
      console.error("Error getUser:", userError)
      throw new Error("No se pudo obtener el usuario autenticado.")
    }

    const userId = userData?.user?.id
    if (!userId) {
      throw new Error("No hay usuario autenticado para registrar como creador.")
    }


      // 1️⃣ Leer reglas activas desde calendar_rules
      const { data: rules, error: rulesError } = await supabase
        .from("calendar_rules")
        .select("rule_key, is_enabled")
        .eq("is_enabled", true)

      if (rulesError) {
        console.error(rulesError)
        throw new Error("Error al cargar las reglas activas.")
      }

      const enabledRuleKeys = (rules || []).map((r) => r.rule_key)

      if (!enabledRuleKeys.length) {
        throw new Error(
          "No hay reglas activas. Activa alguna en 'Reglas del calendario'.",
        )
      }

      // 2️⃣ Generar eventos usando solo esas reglas
      const events = generateAutoEventsForYear(year, enabledRuleKeys)

      if (!events.length) {
        throw new Error(
          "No se generaron eventos. Revisa las reglas y el año seleccionado.",
        )
      }

      // 3️⃣ Insertar en Supabase (tabla events)
     const { error: insertError } = await supabase.from("events").insert(
  events.map((ev) => ({
    title: ev.title,
    description: ev.description || null,
    date_start: ev.date,           // "YYYY-MM-DD" → Supabase lo convierte a timestamptz
    date_end: ev.date,
    all_day: ev.time ? false : true,
    type: "MINISTERIAL",           // 👈 valor válido del enum event_type
    status: "APROBADO",            // 👈 encaja con tu enum event_status
    ministry_id: "1",             // eventos generales
    created_by: userId,              // permitido (nullable)
     color: ev.color || null, 
    is_generated: true,
    is_fixed: true,
    // year, rule_id, has_conflict, conflicts_with, created_at, last_updated_at
    // los maneja el default / trigger
  })),
)


      if (insertError) {
        console.error(insertError)
        throw new Error("Error al insertar eventos en la base de datos.")
      }

      setMessage(
        `Se generaron ${events.length} eventos automáticos para el año ${year}, según las reglas activas.`,
      )
    } catch (e) {
      console.error(e)
      setError(e.message || "Ocurrió un error al generar el calendario.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-auto-calendar">
      <h2>Generar calendario automático por año</h2>
      <p style={{ maxWidth: 600 }}>
        Esta opción creará eventos automáticos (cultos, vigilias, ayunos,
        especiales, feriados, etc.) para el año seleccionado, respetando las
        reglas activas en <strong>Reglas del calendario</strong>.
      </p>

      <div style={{ margin: "1rem 0" }}>
        <label>
          Año:&nbsp;
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            min="2024"
            max="2100"
          />
        </label>
      </div>

      <button onClick={handleGenerate} disabled={loading}>
        {loading ? "Generando..." : `Generar calendario ${year}`}
      </button>

      {message && (
        <p style={{ color: "green", marginTop: "0.5rem" }}>{message}</p>
      )}
      {error && <p style={{ color: "red", marginTop: "0.5rem" }}>{error}</p>}
    </div>
  )
}
