// src/pages/admin/AdminCalendarRules.jsx
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../lib/supabase"

export default function AdminCalendarRules() {
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const navigate = useNavigate()

  const loadRules = async () => {
    setLoading(true)
    setError("")
    setMessage("")
    const { data, error } = await supabase
      .from("calendar_rules")
      .select("*")
      .order("name", { ascending: true })

    if (error) {
      console.error(error)
      setError("Error al cargar las reglas del calendario.")
    } else {
      setRules(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadRules()
  }, [])

  const handleToggle = (id, currentValue, canDisable) => {
    if (!canDisable) return
    setRules((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, is_enabled: !currentValue } : r
      )
    )
  }

  const handleSave = async () => {
    setSaving(true)
    setError("")
    setMessage("")

    try {
      const updates = rules.map((r) => ({
        id: r.id,
        is_enabled: r.is_enabled,
      }))

      const { error } = await supabase.from("calendar_rules").upsert(updates, {
        onConflict: "id",
      })

      if (error) {
        console.error(error)
        setError("Error al guardar los cambios.")
      } else {
        setMessage("Reglas guardadas correctamente.")
      }
    } catch (e) {
      console.error(e)
      setError("Ocurrió un error al guardar.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p>Cargando reglas de calendario...</p>
  }

  return (
    <div
      style={{
        padding: "2rem 1.5rem",
        maxWidth: "960px",
        margin: "0 auto",
      }}
    >
      {/* 🔵 Botón Volver + Título */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
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
          Volver
        </button>

        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "1.8rem",
              fontWeight: 700,
            }}
          >
            Reglas automáticas del calendario
          </h1>
          <p
            style={{
              margin: "0.35rem 0 0",
              color: "#555",
              fontSize: "0.95rem",
              maxWidth: "650px",
            }}
          >
            Activa o desactiva las reglas que generan eventos automáticos como
            <strong> cultos, vigilias, ayunos, especiales</strong> y otros.
            Los feriados nacionales están bloqueados.
          </p>
        </div>
      </div>

      {/* 🔵 Tarjeta principal */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "1rem",
          padding: "1.6rem 1.8rem",
          boxShadow: "0 10px 25px rgba(15,23,42,0.07)",
          border: "1px solid #f3f4f6",
        }}
      >
        {error && (
          <div
            style={{
              marginBottom: "1rem",
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

        {message && (
          <div
            style={{
              marginBottom: "1rem",
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

        {/* Tabla premium */}
        <table
          className="rules-table"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "1.5rem",
          }}
        >
          <thead>
            <tr
              style={{
                background: "#f9fafb",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Activa</th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Regla</th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>
                Descripción
              </th>
              <th style={{ padding: "0.75rem", textAlign: "center" }}>
                Bloqueada
              </th>
            </tr>
          </thead>

          <tbody>
            {rules.map((rule) => (
              <tr
                key={rule.id}
                style={{
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <td style={{ textAlign: "center", padding: "0.65rem" }}>
                  <input
                    type="checkbox"
                    checked={rule.is_enabled}
                    disabled={!rule.can_disable}
                    onChange={() =>
                      handleToggle(
                        rule.id,
                        rule.is_enabled,
                        rule.can_disable
                      )
                    }
                  />
                </td>

                <td style={{ padding: "0.65rem" }}>
                  <strong>{rule.name}</strong>
                  <br />
                  <code
                    style={{
                      fontSize: "0.75rem",
                      color: "#6b7280",
                    }}
                  >
                    {rule.rule_key}
                  </code>
                </td>

                <td style={{ padding: "0.65rem" }}>{rule.description}</td>

                <td
                  style={{
                    textAlign: "center",
                    padding: "0.65rem",
                    color: rule.can_disable ? "#6b7280" : "#2563eb",
                    fontWeight: 500,
                  }}
                >
                  {rule.can_disable ? "No" : "Sí (feriado nacional)"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Botón guardar premium */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "0.55rem 1.4rem",
            borderRadius: "999px",
            border: "none",
            fontWeight: 600,
            fontSize: "0.95rem",
            background: saving ? "#9ca3af" : "#4f46e5",
            color: "#ffffff",
            cursor: saving ? "default" : "pointer",
            boxShadow: saving
              ? "none"
              : "0 10px 20px rgba(79,70,229,0.35)",
          }}
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  )
}
