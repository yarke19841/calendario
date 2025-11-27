// src/pages/admin/AdminCalendarRules.jsx
import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

export default function AdminCalendarRules() {
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

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
    if (!canDisable) return // no dejar tocar si está bloqueada
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
      // Solo enviamos id + is_enabled
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
    <div className="admin-calendar-rules">
      <h2>Reglas automáticas del calendario</h2>
      <p style={{ maxWidth: 600 }}>
        Aquí puedes activar o desactivar las reglas que generan eventos
        automáticos (cultos, vigilias, ayunos, especiales, etc.). Los feriados
        nacionales están bloqueados y siempre se mostrarán.
      </p>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}

      <table className="rules-table">
        <thead>
          <tr>
            <th>Activa</th>
            <th>Regla</th>
            <th>Descripción</th>
            <th>Bloqueada</th>
          </tr>
        </thead>
        <tbody>
          {rules.map((rule) => (
            <tr key={rule.id}>
              <td style={{ textAlign: "center" }}>
                <input
                  type="checkbox"
                  checked={rule.is_enabled}
                  disabled={!rule.can_disable}
                  onChange={() =>
                    handleToggle(rule.id, rule.is_enabled, rule.can_disable)
                  }
                />
              </td>
              <td>
                <strong>{rule.name}</strong>
                <br />
                <code style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  {rule.rule_key}
                </code>
              </td>
              <td>{rule.description}</td>
              <td style={{ textAlign: "center" }}>
                {!rule.can_disable ? "Sí (feriado nacional)" : "No"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{ marginTop: "1rem" }}
      >
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>
    </div>
  )
}
