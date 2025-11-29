// src/pages/admin/AdminLeaders.jsx
import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../lib/supabase.js"

export default function AdminLeaders() {
  const [ministries, setMinistries] = useState([])
  const [leaders, setLeaders] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [msg, setMsg] = useState("")

  // --- búsqueda en Auth/Profiles ---
  const [searchTerm, setSearchTerm] = useState("")
  const [authResults, setAuthResults] = useState([])
  const [authLoading, setAuthLoading] = useState(false)

  // --- formulario de líder seleccionado ---
  const [leaderId, setLeaderId] = useState(null) // id = uuid de auth/users
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("leader") // 'admin' | 'leader'
  const [ministryId, setMinistryId] = useState("")
  const [active, setActive] = useState(true)

  const navigate = useNavigate()

  // =============================
  // Carga inicial
  // =============================
  const loadData = useCallback(async () => {
    setError("")
    setMsg("")
    setLoading(true)
    try {
      const { data: mins, error: e1 } = await supabase
        .from("ministries")
        .select("id, name, active")
        .order("name", { ascending: true })

      if (e1) throw e1

      const { data: le, error: e2 } = await supabase
        .from("leaders")
        .select("id, name, email, role, ministry_id, active, created_at")
        .order("name", { ascending: true })

      if (e2) throw e2

      setMinistries(mins || [])
      setLeaders(le || [])
    } catch (err) {
      console.error(err)
      setError(err.message || "Error al cargar líderes / ministerios")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // =============================
  // Búsqueda en Auth (Profiles)
  // =============================
  const handleSearchAuth = useCallback(
    async (e) => {
      e?.preventDefault()
      setError("")
      setMsg("")

      const term = searchTerm.trim()
      if (!term) {
        setAuthResults([])
        return
      }

      setAuthLoading(true)
      try {
        const { data, error: e1 } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .or(`full_name.ilike.%${term}%,email.ilike.%${term}%`)
          .order("full_name", { ascending: true })
          .limit(15)

        if (e1) throw e1
        setAuthResults(data || [])
        if (!data || data.length === 0) {
          setMsg("No se encontraron usuarios en Auth con ese nombre/correo.")
        }
      } catch (err) {
        console.error(err)
        setError(
          err.message ||
            "Error al buscar en Auth/Profiles. Verifica el nombre de la tabla.",
        )
      } finally {
        setAuthLoading(false)
      }
    },
    [searchTerm],
  )

  const handlePickAuthUser = (user) => {
    setLeaderId(user.id)
    setName(user.full_name || "")
    setEmail(user.email || "")
    setMsg("Usuario seleccionado desde Auth. Completa los datos y guarda.")
  }

  // =============================
  // Guardar líder (upsert)
  // =============================
  const resetForm = () => {
    setLeaderId(null)
    setName("")
    setEmail("")
    setRole("leader")
    setMinistryId("")
    setActive(true)
    setAuthResults([])
    setSearchTerm("")
  }

  const handleSaveLeader = async (e) => {
    e.preventDefault()
    setError("")
    setMsg("")
    if (!leaderId) {
      setError("Primero debes seleccionar un usuario desde Auth/Profiles.")
      return
    }
    if (!name.trim()) {
      setError("El nombre es obligatorio.")
      return
    }

    setSaving(true)
    try {
      const payload = {
        id: leaderId,
        name: name.trim(),
        email: email?.trim() || null,
        role,
        ministry_id: ministryId || null,
        active,
      }

      const { error: e1 } = await supabase
        .from("leaders")
        .upsert(payload, { onConflict: "id" })

      if (e1) throw e1

      setMsg("Líder guardado correctamente.")
      await loadData()
    } catch (err) {
      console.error(err)
      setError(err.message || "Error al guardar el líder.")
    } finally {
      setSaving(false)
    }
  }

  // =============================
  // Editar líder desde la tabla
  // =============================
  const handleEditFromTable = (row) => {
    setLeaderId(row.id)
    setName(row.name || "")
    setEmail(row.email || "")
    setRole(row.role || "leader")
    setMinistryId(row.ministry_id || "")
    setActive(row.active ?? true)
    setMsg("Editando líder existente.")
  }

  // =============================
  // Render
  // =============================
  return (
    <div
      style={{
        padding: "2rem 1.5rem",
        maxWidth: "1100px",
        margin: "0 auto",
      }}
    >
      {/* Header premium con Volver + título */}
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
              fontSize: "1.9rem",
              fontWeight: 700,
            }}
          >
            Administrar líderes
          </h1>
          <p
            style={{
              margin: "0.35rem 0 0",
              color: "#4b5563",
              fontSize: "0.95rem",
              maxWidth: "640px",
            }}
          >
            Conecta usuarios de <strong>Auth / Profiles</strong> con la tabla de{" "}
            <strong>líderes</strong>, asignando roles, ministerios y estado
            activo.
          </p>
        </div>
      </div>

      {loading && (
        <p style={{ marginBottom: "1rem", fontSize: "0.9rem", color: "#6b7280" }}>
          Cargando datos...
        </p>
      )}

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

      {/* 1. Buscar en Auth / Profiles */}
      <section
        style={{
          marginBottom: "1.5rem",
          background: "#ffffff",
          borderRadius: "1rem",
          padding: "1.4rem 1.6rem",
          boxShadow: "0 10px 25px rgba(15,23,42,0.07)",
          border: "1px solid #f3f4f6",
        }}
      >
        <h2
          style={{
            margin: 0,
            marginBottom: "0.75rem",
            fontSize: "1rem",
            fontWeight: 600,
          }}
        >
          1. Buscar usuario en Auth / Profiles
        </h2>

        <form
          onSubmit={handleSearchAuth}
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            alignItems: "center",
          }}
        >
          <input
            type="text"
            placeholder="Escribe nombre o correo del líder..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: "1 1 220px",
              minWidth: "220px",
              borderRadius: "0.75rem",
              border: "1px solid #d1d5db",
              padding: "0.5rem 0.75rem",
              fontSize: "0.9rem",
            }}
          />
          <button
            type="submit"
            disabled={authLoading}
            style={{
              padding: "0.5rem 1.2rem",
              borderRadius: "999px",
              border: "none",
              fontSize: "0.9rem",
              fontWeight: 600,
              background: authLoading ? "#9ca3af" : "#4f46e5",
              color: "#ffffff",
              cursor: authLoading ? "default" : "pointer",
              boxShadow: authLoading
                ? "none"
                : "0 8px 18px rgba(79,70,229,0.35)",
            }}
          >
            {authLoading ? "Buscando..." : "Buscar en Auth"}
          </button>
        </form>

        {authResults.length > 0 && (
          <div
            style={{
              marginTop: "0.9rem",
              maxHeight: "260px",
              overflow: "auto",
              borderRadius: "0.75rem",
              border: "1px solid #e5e7eb",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.85rem",
              }}
            >
              <thead
                style={{
                  background: "#f9fafb",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <tr>
                  <th style={{ textAlign: "left", padding: "0.4rem 0.6rem" }}>
                    Nombre
                  </th>
                  <th style={{ textAlign: "left", padding: "0.4rem 0.6rem" }}>
                    Correo
                  </th>
                  <th style={{ padding: "0.4rem 0.6rem" }} />
                </tr>
              </thead>
              <tbody>
                {authResults.map((u) => (
                  <tr key={u.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "0.4rem 0.6rem" }}>{u.full_name}</td>
                    <td style={{ padding: "0.4rem 0.6rem" }}>{u.email}</td>
                    <td
                      style={{
                        padding: "0.4rem 0.6rem",
                        textAlign: "right",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handlePickAuthUser(u)}
                        style={{
                          fontSize: "0.75rem",
                          padding: "0.25rem 0.6rem",
                          borderRadius: "999px",
                          border: "none",
                          background: "#059669",
                          color: "#ffffff",
                          cursor: "pointer",
                        }}
                      >
                        Usar como líder
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p
          style={{
            marginTop: "0.6rem",
            fontSize: "0.75rem",
            color: "#9ca3af",
          }}
        >
          * Si no aparece, luego podemos hacer un flujo para crearlo en Auth y
          después registrarlo como líder.
        </p>
      </section>

      {/* 2. Datos del líder */}
      <section
        style={{
          marginBottom: "1.5rem",
          background: "#ffffff",
          borderRadius: "1rem",
          padding: "1.4rem 1.6rem",
          boxShadow: "0 10px 25px rgba(15,23,42,0.07)",
          border: "1px solid #f3f4f6",
        }}
      >
        <h2
          style={{
            margin: 0,
            marginBottom: "0.75rem",
            fontSize: "1rem",
            fontWeight: 600,
          }}
        >
          2. Datos del líder
        </h2>

        <form onSubmit={handleSaveLeader} style={{ fontSize: "0.9rem" }}>
          {/* fila 1 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "0.9rem",
              marginBottom: "0.9rem",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.25rem",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}
              >
                ID de usuario (Auth)
              </label>
              <input
                type="text"
                value={leaderId || ""}
                readOnly
                placeholder="Selecciona un usuario desde Auth arriba"
                style={{
                  width: "100%",
                  borderRadius: "0.75rem",
                  border: "1px solid #e5e7eb",
                  padding: "0.45rem 0.7rem",
                  fontSize: "0.8rem",
                  background: "#f9fafb",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.25rem",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}
              >
                Rol del líder
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  width: "100%",
                  borderRadius: "0.75rem",
                  border: "1px solid #d1d5db",
                  padding: "0.45rem 0.7rem",
                  fontSize: "0.9rem",
                }}
              >
                <option value="leader">Leader</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {/* fila 2 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "0.9rem",
              marginBottom: "0.9rem",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.25rem",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}
              >
                Nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del líder"
                style={{
                  width: "100%",
                  borderRadius: "0.75rem",
                  border: "1px solid #d1d5db",
                  padding: "0.45rem 0.7rem",
                  fontSize: "0.9rem",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.25rem",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}
              >
                Correo
              </label>
              <input
                type="email"
                value={email || ""}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                style={{
                  width: "100%",
                  borderRadius: "0.75rem",
                  border: "1px solid #d1d5db",
                  padding: "0.45rem 0.7rem",
                  fontSize: "0.9rem",
                }}
              />
            </div>
          </div>

          {/* fila 3 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "0.9rem",
              marginBottom: "0.9rem",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.25rem",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}
              >
                Ministerio
              </label>
              <select
                value={ministryId}
                onChange={(e) => setMinistryId(e.target.value)}
                style={{
                  width: "100%",
                  borderRadius: "0.75rem",
                  border: "1px solid #d1d5db",
                  padding: "0.45rem 0.7rem",
                  fontSize: "0.9rem",
                }}
              >
                <option value="">[Sin ministerio asignado]</option>
                {ministries.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.active === false ? "(inactivo)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                marginTop: "0.8rem",
              }}
            >
              <input
                id="active"
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                style={{ width: "16px", height: "16px" }}
              />
              <label
                htmlFor="active"
                style={{ fontSize: "0.9rem", fontWeight: 500 }}
              >
                Líder activo
              </label>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.4rem" }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "0.5rem 1.2rem",
                borderRadius: "999px",
                border: "none",
                fontSize: "0.9rem",
                fontWeight: 600,
                background: saving ? "#9ca3af" : "#4f46e5",
                color: "#ffffff",
                cursor: saving ? "default" : "pointer",
                boxShadow: saving
                  ? "none"
                  : "0 8px 18px rgba(79,70,229,0.35)",
              }}
            >
              {saving ? "Guardando..." : "Guardar líder"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              style={{
                padding: "0.5rem 1.2rem",
                borderRadius: "999px",
                border: "1px solid #e5e7eb",
                fontSize: "0.9rem",
                background: "#ffffff",
                cursor: "pointer",
              }}
            >
              Limpiar formulario
            </button>
          </div>
        </form>
      </section>

      {/* 3. Líderes registrados */}
      <section
        style={{
          background: "#ffffff",
          borderRadius: "1rem",
          padding: "1.4rem 1.6rem",
          boxShadow: "0 10px 25px rgba(15,23,42,0.07)",
          border: "1px solid #f3f4f6",
        }}
      >
        <h2
          style={{
            margin: 0,
            marginBottom: "0.75rem",
            fontSize: "1rem",
            fontWeight: 600,
          }}
        >
          3. Líderes registrados
        </h2>

        {leaders.length === 0 ? (
          <p style={{ fontSize: "0.9rem", color: "#6b7280" }}>
            Aún no hay líderes registrados.
          </p>
        ) : (
          <div
            style={{
              marginTop: "0.3rem",
              maxHeight: "360px",
              overflow: "auto",
              borderRadius: "0.75rem",
              border: "1px solid #e5e7eb",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.85rem",
              }}
            >
              <thead
                style={{
                  background: "#f9fafb",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <tr>
                  <th style={{ textAlign: "left", padding: "0.45rem 0.6rem" }}>
                    Nombre
                  </th>
                  <th style={{ textAlign: "left", padding: "0.45rem 0.6rem" }}>
                    Correo
                  </th>
                  <th style={{ textAlign: "left", padding: "0.45rem 0.6rem" }}>
                    Rol
                  </th>
                  <th style={{ textAlign: "left", padding: "0.45rem 0.6rem" }}>
                    Ministerio
                  </th>
                  <th style={{ textAlign: "left", padding: "0.45rem 0.6rem" }}>
                    Activo
                  </th>
                  <th style={{ textAlign: "left", padding: "0.45rem 0.6rem" }}>
                    Creado
                  </th>
                  <th style={{ padding: "0.45rem 0.6rem" }} />
                </tr>
              </thead>
              <tbody>
                {leaders.map((l) => {
                  const ministryName =
                    ministries.find((m) => m.id === l.ministry_id)?.name || "-"
                  return (
                    <tr key={l.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "0.45rem 0.6rem" }}>{l.name}</td>
                      <td style={{ padding: "0.45rem 0.6rem" }}>{l.email}</td>
                      <td style={{ padding: "0.45rem 0.6rem" }}>{l.role}</td>
                      <td style={{ padding: "0.45rem 0.6rem" }}>
                        {ministryName}
                      </td>
                      <td style={{ padding: "0.45rem 0.6rem" }}>
                        {l.active ? "Sí" : "No"}
                      </td>
                      <td style={{ padding: "0.45rem 0.6rem" }}>
                        {l.created_at
                          ? new Date(l.created_at).toLocaleDateString()
                          : ""}
                      </td>
                      <td
                        style={{
                          padding: "0.45rem 0.6rem",
                          textAlign: "right",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleEditFromTable(l)}
                          style={{
                            fontSize: "0.75rem",
                            padding: "0.25rem 0.6rem",
                            borderRadius: "999px",
                            border: "1px solid #e5e7eb",
                            background: "#ffffff",
                            cursor: "pointer",
                          }}
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
