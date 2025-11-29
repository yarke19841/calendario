// src/pages/admin/AdminMinistries.jsx
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../lib/supabase"

export default function AdminMinistries() {
  const [ministries, setMinistries] = useState([])
  const [name, setName] = useState("")
  const [newActive, setNewActive] = useState(true) // 👈 estado del ministerio nuevo

  const [loading, setLoading] = useState(false)  // carga de lista
  const [saving, setSaving] = useState(false)    // guardando nuevo
  const [togglingId, setTogglingId] = useState(null) // id que se está activando/desactivando

  const [error, setError] = useState("")
  const [msg, setMsg] = useState("")

  const navigate = useNavigate()

  async function loadMinistries() {
    setError("")
    setMsg("")
    setLoading(true)

    const { data, error } = await supabase
      .from("ministries")
      .select("id, name, active")
      .order("name", { ascending: true })

    if (error) {
      console.error(error)
      setError("Error cargando ministerios")
    } else {
      setMinistries(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadMinistries()
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setError("")
    setMsg("")
    setSaving(true)

    const { error } = await supabase.from("ministries").insert({
      name,
      active: newActive, // 👈 se guarda activo/inactivo según el checkbox
    })

    if (error) {
      console.error(error)
      setError("Error creando ministerio")
    } else {
      setName("")
      setNewActive(true)
      setMsg("Ministerio creado correctamente.")
      await loadMinistries()
    }
    setSaving(false)
  }

  // 👇 Activar / desactivar ministerio existente
  async function handleToggleActive(id, currentActive) {
    setError("")
    setMsg("")
    setTogglingId(id)

    const { error } = await supabase
      .from("ministries")
      .update({ active: !currentActive })
      .eq("id", id)

    if (error) {
      console.error(error)
      setError("Error al actualizar el estado del ministerio.")
    } else {
      setMsg(
        `Ministerio ${!currentActive ? "activado" : "desactivado"} correctamente.`,
      )
      // Actualizamos localmente para no recargar todo si no quieres
      setMinistries((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, active: !currentActive } : m,
        ),
      )
    }

    setTogglingId(null)
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
          gap: "0.75rem",
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
          <span>Volver</span>
        </button>

        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "1.8rem",
              fontWeight: 700,
            }}
          >
            Administrar ministerios
          </h1>
          <p
            style={{
              margin: "0.35rem 0 0",
              color: "#4b5563",
              fontSize: "0.95rem",
              maxWidth: "620px",
            }}
          >
            Crea, desactiva o reactiva los ministerios de la iglesia para
            usarlos en líderes y eventos.
          </p>
        </div>
      </div>

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

      {msg && (
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
          {msg}
        </div>
      )}

      {/* Layout */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 320px) minmax(0, 1fr)",
          gap: "1.75rem",
          alignItems: "flex-start",
        }}
      >
        {/* Formulario */}
        <form
          onSubmit={handleCreate}
          style={{
            background: "#ffffff",
            padding: "1.4rem 1.6rem",
            borderRadius: "1rem",
            boxShadow: "0 10px 25px rgba(15,23,42,0.07)",
            border: "1px solid #f3f4f6",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: "0.75rem",
              fontSize: "1.05rem",
              fontWeight: 600,
            }}
          >
            Nuevo ministerio
          </h2>

          <div style={{ marginBottom: "0.75rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                marginBottom: 4,
                fontWeight: 500,
              }}
            >
              Nombre
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ej. Jóvenes, Damas, Varones..."
              style={{
                width: "100%",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                padding: "0.45rem 0.6rem",
                fontSize: "0.95rem",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              marginBottom: "0.5rem",
            }}
          >
            <input
              id="newActive"
              type="checkbox"
              checked={newActive}
              onChange={(e) => setNewActive(e.target.checked)}
              style={{ width: 16, height: 16 }}
            />
            <label
              htmlFor="newActive"
              style={{ fontSize: "0.9rem", fontWeight: 500 }}
            >
              Ministerio activo
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              marginTop: "0.5rem",
              borderRadius: 999,
              border: "none",
              padding: "0.45rem 0.9rem",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: saving ? "default" : "pointer",
              background: saving ? "#9ca3af" : "#4f46e5",
              color: "white",
              boxShadow: saving
                ? "none"
                : "0 8px 18px rgba(79,70,229,0.35)",
            }}
          >
            {saving ? "Guardando..." : "Guardar ministerio"}
          </button>
        </form>

        {/* Listado */}
        <div
          style={{
            background: "#ffffff",
            padding: "1.4rem 1.6rem",
            borderRadius: "1rem",
            boxShadow: "0 10px 25px rgba(15,23,42,0.07)",
            border: "1px solid #f3f4f6",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: "0.5rem",
              fontSize: "1.05rem",
              fontWeight: 600,
            }}
          >
            Ministerios registrados
          </h2>

          {loading && ministries.length === 0 && (
            <p style={{ fontSize: "0.9rem", color: "#6b7280" }}>
              Cargando ministerios...
            </p>
          )}

          {!loading && ministries.length === 0 && (
            <p style={{ fontSize: "0.9rem", color: "#6b7280" }}>
              No hay ministerios registrados todavía.
            </p>
          )}

          {ministries.length > 0 && (
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                marginTop: "0.75rem",
                display: "grid",
                gap: "0.5rem",
              }}
            >
              {ministries.map((m) => {
                const isProcessing = togglingId === m.id
                const isActive = m.active !== false // si es null/undefined lo tratamos como activo
                // 👇 Bloqueo del ministerio Admin
                const isAdminMinistry = m.name.trim().toLowerCase() === "admin"
                return (
                  <li
  key={m.id}
  style={{
    background: "#f9fafb",
    borderRadius: 10,
    padding: "0.6rem 0.8rem",
    border: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "0.75rem",
  }}
>
  <div style={{ display: "flex", flexDirection: "column" }}>
    <span
      style={{
        fontWeight: 600,
        fontSize: "0.95rem",
        color: isActive ? "#111827" : "#6b7280",
      }}
    >
      {m.name} {!isActive && !isAdminMinistry && "(inactivo)"}
      {isAdminMinistry && (
        <span
          style={{
            marginLeft: 6,
            padding: "2px 6px",
            borderRadius: 6,
            fontSize: "0.7rem",
            background: "#e5e7eb",
            color: "#374151",
          }}
        >
          🔒 Bloqueado
        </span>
      )}
    </span>

    <code
      style={{
        fontSize: "0.75rem",
        color: "#6b7280",
        marginTop: "2px",
        wordBreak: "break-all",
      }}
    >
      {m.id}
    </code>
  </div>

  {/* 🔒 Bloquear el ministerio Admin */}
  {isAdminMinistry ? (
    <button
      type="button"
      disabled
      style={{
        borderRadius: 999,
        padding: "0.3rem 0.8rem",
        fontSize: "0.8rem",
        background: "#e5e7eb",
        border: "1px solid #cbd5e1",
        color: "#6b7280",
        cursor: "not-allowed",
      }}
    >
      Protegido
    </button>
  ) : (
    <button
      type="button"
      disabled={isProcessing}
      onClick={() => handleToggleActive(m.id, isActive)}
      style={{
        borderRadius: 999,
        border: "1px solid #e5e7eb",
        padding: "0.3rem 0.8rem",
        fontSize: "0.8rem",
        cursor: isProcessing ? "default" : "pointer",
        background: isActive ? "#fee2e2" : "#dcfce7",
        color: isActive ? "#b91c1c" : "#166534",
        whiteSpace: "nowrap",
      }}
    >
      {isProcessing ? "Actualizando..." : isActive ? "Desactivar" : "Activar"}
    </button>
  )}
</li>

                )
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
