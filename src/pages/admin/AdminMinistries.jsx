// src/pages/admin/AdminMinistries.jsx
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { supabase } from "../../lib/supabase"

export default function AdminMinistries() {
  const [ministries, setMinistries] = useState([])
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function loadMinistries() {
    setError("")
    setLoading(true)
    const { data, error } = await supabase
      .from("ministries")
      .select("id, name")        // 👈 solo columnas que seguro existen
      .order("name", { ascending: true })

    console.log("Ministries data =>", data, "error =>", error)

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
    setLoading(true)

    const { error } = await supabase
      .from("ministries")
      .insert({ name })        // 👈 solo name, nada de description

    if (error) {
      console.error(error)
      setError("Error creando ministerio")
    } else {
      setName("")
      loadMinistries()
    }
    setLoading(false)
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "white",
        padding: "2rem",
      }}
    >
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ margin: 0 }}>Administrar Ministerios</h1>
        <p style={{ margin: 0, color: "#9ca3af" }}>
          Crea y administra los ministerios de la iglesia.
        </p>
        <Link to="/admin" style={{ color: "#93c5fd", fontSize: "0.9rem" }}>
          ← Volver al panel admin
        </Link>
      </header>

      {error && (
        <div
          style={{
            background: "#7f1d1d",
            padding: "0.5rem 0.75rem",
            borderRadius: 8,
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 320px) minmax(0, 1fr)",
          gap: "2rem",
          alignItems: "flex-start",
        }}
      >
        {/* Formulario */}
        <form
          onSubmit={handleCreate}
          style={{
            background: "#0b1120",
            padding: "1.25rem",
            borderRadius: 12,
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Nuevo Ministerio</h2>

          <div style={{ marginBottom: "0.75rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.9rem",
                marginBottom: 4,
              }}
            >
              Nombre
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: "100%",
                borderRadius: 8,
                border: "1px solid #334155",
                padding: "0.45rem 0.6rem",
                fontSize: "0.95rem",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "0.5rem",
              borderRadius: 999,
              border: "none",
              padding: "0.45rem 0.9rem",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: loading ? "wait" : "pointer",
              background: "#4f46e5",
              color: "white",
            }}
          >
            {loading ? "Guardando..." : "Guardar ministerio"}
          </button>
        </form>

        {/* Listado */}
        <div>
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Listado</h2>
          {loading && ministries.length === 0 && <p>Cargando ministerios...</p>}
          {ministries.length === 0 && !loading && (
            <p>No hay ministerios registrados todavía.</p>
          )}

          <ul
            style={{
              listStyle: "none",
              padding: 0,
              marginTop: "0.75rem",
              display: "grid",
              gap: "0.5rem",
            }}
          >
            {ministries.map((m) => (
              <li
                key={m.id}
                style={{
                  background: "#020617",
                  borderRadius: 10,
                  padding: "0.6rem 0.8rem",
                  border: "1px solid #1e293b",
                }}
              >
                <div style={{ fontWeight: 600 }}>{m.name}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
