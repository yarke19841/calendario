// src/pages/admin/AdminEventsConfig.jsx
// src/pages/admin/AdminEvents.jsx
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../lib/supabase"
import "../../styles/CalendarPage.css"

export default function AdminEvents() {
  const [adminName, setAdminName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [userId, setUserId] = useState(null)

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [msg, setMsg] = useState("")

  const navigate = useNavigate()

  // 🔹 Cargar solo el usuario para mostrar el header
  useEffect(() => {
    const loadUser = async () => {
      const { data, error: authError } = await supabase.auth.getUser()
      const user = data?.user
      if (authError || !user) {
        console.error("Error auth en AdminEvents:", authError)
        setError("No se pudo obtener el usuario autenticado.")
        return
      }

      setUserId(user.id)

      let displayName = ""
      let avatar = ""

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle()

      if (profile?.full_name) displayName = profile.full_name
      if (profile?.avatar_url) avatar = profile.avatar_url

      if (!displayName) displayName = user.email || "Administrador"
      setAdminName(displayName)

      const finalAvatar =
        avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          displayName,
        )}&background=0f172a&color=fff&size=128`
      setAvatarUrl(finalAvatar)
    }

    loadUser()
  }, [])

  // 🔹 SOLO PRUEBA: cargar eventos crudos
  const testLoadEvents = async () => {
    setLoading(true)
    setError("")
    setMsg("")
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("date_start", { ascending: true })
        .limit(20)

      if (error) {
        console.error("Error cargando eventos (test):", error)
        setError("Error cargando eventos desde Supabase.")
        setLoading(false)
        return
      }

      setEvents(data || [])
      setMsg(`Se cargaron ${data?.length || 0} eventos.`)
    } catch (e) {
      console.error("Error inesperado:", e)
      setError("Error inesperado al cargar eventos.")
    } finally {
      setLoading(false)
    }
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

      {/* HEADER SIMPLE */}
      <div className="leader-header mb-6">
        {avatarUrl && (
          <img src={avatarUrl} alt="avatar" className="leader-avatar" />
        )}
        <div>
          <h1>Eventos administrativos (MODO PRUEBA)</h1>
          <p>{adminName || "Administrador"}</p>
        </div>
      </div>

      {/* MENSAJES */}
      {(error || msg) && (
        <div className="mb-4 text-sm">
          {error && <p className="text-red-600">{error}</p>}
          {msg && !error && <p className="text-emerald-600">{msg}</p>}
        </div>
      )}

      {/* BOTÓN PARA PROBAR LA CARGA */}
      <div className="mb-4">
        <button
          onClick={testLoadEvents}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? "Cargando eventos..." : "Probar carga de eventos"}
        </button>
      </div>

      {/* TABLA SIMPLE CON LOS EVENTOS */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-3">Eventos (raw)</h2>

        {events.length === 0 ? (
          <p className="text-sm text-slate-500">
            No hay eventos cargados. Pulsa el botón para probar.
          </p>
        ) : (
          <div className="overflow-auto max-h-[400px]">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-2 py-1 text-left">ID</th>
                  <th className="px-2 py-1 text-left">Título</th>
                  <th className="px-2 py-1 text-left">Fecha inicio</th>
                  <th className="px-2 py-1 text-left">Ministry ID</th>
                  <th className="px-2 py-1 text-left">Creado por</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev.id} className="border-t">
                    <td className="px-2 py-1">{ev.id}</td>
                    <td className="px-2 py-1">{ev.title}</td>
                    <td className="px-2 py-1">{ev.date_start}</td>
                    <td className="px-2 py-1">{ev.ministry_id}</td>
                    <td className="px-2 py-1">{ev.created_by}</td>
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
