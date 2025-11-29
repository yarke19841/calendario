// src/pages/admin/AdminAutoCalendar.jsx
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../lib/supabase"
import { generateAutoEventsForYear } from "../../utils/generateAutoEvents"

export default function AdminAutoCalendar() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const navigate = useNavigate()

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
          date_start: ev.date,
          date_end: ev.date,
          all_day: ev.time ? false : true,
          type: "MINISTERIAL",
          status: "APROBADO",
          ministry_id: "1", // General
          created_by: userId,
          color: ev.color || null,
          is_generated: true,
          is_fixed: true,
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
    <div
      style={{
        padding: "2rem 1.5rem",
        maxWidth: "960px",
        margin: "0 auto",
      }}
    >
      {/* 🔵 Bloque superior con el botón Volver */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        {/* Botón volver */}
        <button
          type="button"
          onClick={() => navigate("/admin")}
          style={{
            alignSelf: "flex-start",
            borderRadius: "999px",
            padding: "0.45rem 1rem",
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            cursor: "pointer",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
          }}
        >
          <span style={{ fontSize: "1rem" }}>←</span>
          <span>Volver</span>
        </button>

        {/* Título premium */}
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "1.8rem",
              fontWeight: 700,
            }}
          >
            Calendario automático
          </h1>
          <p
            style={{
              margin: "0.35rem 0 0",
              color: "#555",
              fontSize: "0.95rem",
            }}
          >
            Genera todos los eventos fijos del año en un solo clic.
          </p>
        </div>
      </div>

      {/* Card principal */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "1rem",
          padding: "1.6rem 1.8rem",
          boxShadow: "0 10px 25px rgba(15,23,42,0.07)",
          border: "1px solid #f3f4f6",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: "0.75rem",
            fontSize: "1.2rem",
          }}
        >
          Generar calendario automático por año
        </h2>

        <p
          style={{
            maxWidth: 650,
            marginBottom: "1.4rem",
            color: "#4b5563",
            fontSize: "0.95rem",
            lineHeight: 1.6,
          }}
        >
          Esta opción creará eventos automáticos (
          <strong>cultos, vigilias, ayunos, especiales, feriados</strong>, etc.)
          para el año seleccionado, respetando las reglas activas en{" "}
          <strong>Reglas del calendario</strong>. Ideal para dejar todo el año
          configurado en segundos.
        </p>

        {/* Controles */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "1rem",
          }}
        >
          <label
            style={{
              fontWeight: 500,
              fontSize: "0.95rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            Año
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              min="2024"
              max="2100"
              style={{
                width: "100px",
                padding: "0.4rem 0.5rem",
                borderRadius: "0.5rem",
                border: "1px solid #d1d5db",
                fontSize: "0.95rem",
              }}
            />
          </label>

          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              padding: "0.55rem 1.4rem",
              borderRadius: "999px",
              border: "none",
              cursor: loading ? "default" : "pointer",
              fontWeight: 600,
              fontSize: "0.95rem",
              background: loading ? "#9ca3af" : "#4f46e5",
              color: "#ffffff",
              boxShadow: loading
                ? "none"
                : "0 10px 20px rgba(79,70,229,0.35)",
              transition: "transform 0.08s ease",
            }}
          >
            {loading ? "Generando..." : `Generar calendario ${year}`}
          </button>
        </div>

        {/* Mensajes */}
        {message && (
          <div
            style={{
              marginTop: "0.75rem",
              padding: "0.75rem 1rem",
              borderRadius: "0.75rem",
              background: "#ecfdf3",
              border: "1px solid #4ade80",
              color: "#166534",
              fontSize: "0.9rem",
            }}
          >
            {message}
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: "0.75rem",
              padding: "0.75rem 1rem",
              borderRadius: "0.75rem",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              fontSize: "0.9rem",
            }}
          >
            {error}
          </div>
        )}

        {!loading && !message && !error && (
          <p
            style={{
              marginTop: "0.8rem",
              fontSize: "0.85rem",
              color: "#9ca3af",
            }}
          >
            Tip: revisa las reglas en{" "}
            <strong>Reglas del calendario</strong> antes de generar el año.
          </p>
        )}
      </div>
    </div>
  )
}
