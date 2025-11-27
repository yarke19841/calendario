// src/pages/admin/AdminLeaders.jsx
import { useEffect, useState, useCallback } from "react"
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

  // =============================
  // Carga inicial
  // =============================
  const loadData = useCallback(async () => {
    setError("")
    setMsg("")
    setLoading(true)
    try {
      // Ministérios (para el combo)
      const { data: mins, error: e1 } = await supabase
        .from("ministries")
        .select("id, name, active")
        .order("name", { ascending: true })

      if (e1) throw e1

      // Líderes actuales
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
        // Ajusta "profiles" y las columnas a tu esquema real
        const { data, error: e1 } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .or(
            `full_name.ilike.%${term}%,email.ilike.%${term}%`
          )
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
            "Error al buscar en Auth/Profiles. Verifica el nombre de la tabla."
        )
      } finally {
        setAuthLoading(false)
      }
    },
    [searchTerm]
  )

  const handlePickAuthUser = (user) => {
    setLeaderId(user.id) // uuid de auth.users
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
        id: leaderId, // mismo uuid de Auth
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
      // No hacemos reset completo para que sigas viendo el registro
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
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Administrar Líderes</h1>

      {loading && <p>Cargando datos...</p>}

      {error && (
        <div className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      {msg && (
        <div className="mb-3 rounded border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {msg}
        </div>
      )}

      {/* ===================== BUSCAR EN AUTH / PROFILES ===================== */}
      <section className="mb-6 border rounded-lg p-4 bg-white shadow-sm">
        <h2 className="font-semibold mb-2">
          1. Buscar usuario en Auth / Profiles
        </h2>
        <form
          onSubmit={handleSearchAuth}
          className="flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          <input
            type="text"
            className="border rounded px-3 py-2 flex-1 text-sm"
            placeholder="Escribe nombre o correo del líder..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            type="submit"
            disabled={authLoading}
            className="px-4 py-2 text-sm rounded bg-indigo-600 text-white disabled:opacity-60"
          >
            {authLoading ? "Buscando..." : "Buscar en Auth"}
          </button>
        </form>

        {authResults.length > 0 && (
          <div className="mt-3 max-h-60 overflow-auto border rounded">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-1 text-left">Nombre</th>
                  <th className="px-2 py-1 text-left">Correo</th>
                  <th className="px-2 py-1"></th>
                </tr>
              </thead>
              <tbody>
                {authResults.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="px-2 py-1">{u.full_name}</td>
                    <td className="px-2 py-1">{u.email}</td>
                    <td className="px-2 py-1 text-right">
                      <button
                        type="button"
                        onClick={() => handlePickAuthUser(u)}
                        className="text-xs px-2 py-1 rounded bg-emerald-600 text-white"
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

        <p className="mt-2 text-xs text-gray-500">
          * Si no aparece, luego podemos hacer un flujo para crearlo en Auth y
          después registrarlo como líder.
        </p>
      </section>

      {/* ===================== FORMULARIO DE LÍDER ===================== */}
      <section className="mb-6 border rounded-lg p-4 bg-white shadow-sm">
        <h2 className="font-semibold mb-2">2. Datos del líder</h2>
        <form onSubmit={handleSaveLeader} className="space-y-3 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block mb-1 font-medium">
                ID de usuario (Auth)
              </label>
              <input
                type="text"
                className="border rounded px-3 py-2 w-full text-xs bg-gray-100"
                value={leaderId || ""}
                readOnly
                placeholder="Selecciona un usuario desde Auth arriba"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Rol del líder</label>
              <select
                className="border rounded px-3 py-2 w-full"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="leader">Leader</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block mb-1 font-medium">Nombre</label>
              <input
                type="text"
                className="border rounded px-3 py-2 w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del líder"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Correo</label>
              <input
                type="email"
                className="border rounded px-3 py-2 w-full"
                value={email || ""}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block mb-1 font-medium">Ministerio</label>
              <select
                className="border rounded px-3 py-2 w-full"
                value={ministryId}
                onChange={(e) => setMinistryId(e.target.value)}
              >
                <option value="">[Sin ministerio asignado]</option>
                {ministries.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.active === false ? "(inactivo)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 mt-5">
              <input
                id="active"
                type="checkbox"
                className="h-4 w-4"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              <label htmlFor="active" className="text-sm font-medium">
                Líder activo
              </label>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded bg-indigo-600 text-white text-sm disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Guardar líder"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded border text-sm"
            >
              Limpiar formulario
            </button>
          </div>
        </form>
      </section>

      {/* ===================== LISTA DE LÍDERES ===================== */}
      <section className="border rounded-lg p-4 bg-white shadow-sm">
        <h2 className="font-semibold mb-2">3. Líderes registrados</h2>
        {leaders.length === 0 ? (
          <p className="text-sm text-gray-500">Aún no hay líderes registrados.</p>
        ) : (
          <div className="overflow-auto max-h-[400px] border rounded">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-1 text-left">Nombre</th>
                  <th className="px-2 py-1 text-left">Correo</th>
                  <th className="px-2 py-1 text-left">Rol</th>
                  <th className="px-2 py-1 text-left">Ministerio</th>
                  <th className="px-2 py-1 text-left">Activo</th>
                  <th className="px-2 py-1 text-left">Creado</th>
                  <th className="px-2 py-1"></th>
                </tr>
              </thead>
              <tbody>
                {leaders.map((l) => {
                  const ministryName =
                    ministries.find((m) => m.id === l.ministry_id)?.name || "-"
                  return (
                    <tr key={l.id} className="border-t">
                      <td className="px-2 py-1">{l.name}</td>
                      <td className="px-2 py-1">{l.email}</td>
                      <td className="px-2 py-1">{l.role}</td>
                      <td className="px-2 py-1">{ministryName}</td>
                      <td className="px-2 py-1">
                        {l.active ? "Sí" : "No"}
                      </td>
                      <td className="px-2 py-1">
                        {l.created_at
                          ? new Date(l.created_at).toLocaleDateString()
                          : ""}
                      </td>
                      <td className="px-2 py-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleEditFromTable(l)}
                          className="text-xs px-2 py-1 rounded border"
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
