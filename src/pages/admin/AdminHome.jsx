// src/pages/admin/AdminHome.jsx
import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "../../lib/supabase"

export default function AdminHome() {
  const [adminName, setAdminName] = useState("Administrador")
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [nextEvents, setNextEvents] = useState([])

  const navigate = useNavigate()

  async function logout() {
    await supabase.auth.signOut()
    localStorage.clear()
    navigate("/")
  }

  // 🔵 Formato de fecha SIN UTC, igual que en LeaderHome
  function formatDateLocal(dateStr) {
    if (!dateStr) return ""

    const safe = dateStr.slice(0, 10) // "YYYY-MM-DD"
    const [y, m, d] = safe.split("-").map(Number)

    return new Date(y, m - 1, d).toLocaleDateString("es-PA", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
  }

  useEffect(() => {
    const loadData = async () => {
      const session = await supabase.auth.getUser()
      const user = session?.data?.user

      // Si no hay user, intentar al menos mostrar el localStorage
      if (!user) {
        const storedName =
          localStorage.getItem("leader_name") || "Administrador"
        setAdminName(storedName)

        const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          storedName,
        )}&background=0f172a&color=fff&size=128`
        setAvatarUrl(fallbackAvatar)
        return
      }

      // 👉 Ya no usamos tabla profiles, solo auth + localStorage
      let displayName =
        localStorage.getItem("leader_name") ||
        user.user_metadata?.full_name ||
        user.email ||
        "Administrador"

      setAdminName(displayName)

      const finalAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        displayName,
      )}&background=0f172a&color=fff&size=128`

      setAvatarUrl(finalAvatar || null)

      // 🔵 Próximos eventos (para toda la iglesia, con ministerio)
      const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

      const { data: events, error: eventsError } = await supabase
        .from("events")
        .select("id, title, date_start, ministry_id")
        .gte("date_start", today)
        .order("date_start", { ascending: true })
        .limit(5)

      if (eventsError) {
        console.error("Error cargando eventos:", eventsError)
        setNextEvents([])
        return
      }

      const rawEvents = events || []

      // Obtener solo los ministry_id distintos
      const ministryIds = Array.from(
        new Set(
          rawEvents
            .map((ev) => ev.ministry_id)
            .filter((id) => !!id),
        ),
      )

      let ministryMap = {}
      if (ministryIds.length > 0) {
        const { data: mins, error: minsError } = await supabase
          .from("ministries")
          .select("id, name")
          .in("id", ministryIds)

        if (minsError) {
          console.error("Error cargando ministerios:", minsError)
        } else {
          ministryMap = (mins || []).reduce((acc, m) => {
            acc[m.id] = m.name
            return acc
          }, {})
        }
      }

      const decorated = rawEvents.map((ev) => ({
        ...ev,
        ministry_name: ministryMap[ev.ministry_id] || null,
      }))

      setNextEvents(decorated)
    }

    loadData()
  }, [])

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      {/* HEADER */}
      <div className="leader-header">
        <img
          src={avatarUrl || null}
          alt="avatar admin"
          className="leader-avatar"
        />

        <div className="flex-1">
          <h1>Hola, {adminName}</h1>
          <p>Panel de administración de la iglesia</p>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 text-sm bg-white text-indigo-600 rounded-full shadow hover:bg-indigo-50 transition"
        >
          Cerrar sesión
        </button>
      </div>

      {/* CARDS PRINCIPALES (MENÚ ADMIN) */}
      <div className="mt-10 grid gap-6 max-w-3xl mx-auto">
        {/* Ministerios */}
        <Link to="/admin/ministries" className="option-card">
          <div className="option-card-icon">
            <svg
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path d="M4 7h16M4 12h10M4 17h7" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              Ministerios
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Crea y administra los ministerios de la iglesia.
            </p>
          </div>
        </Link>

        {/* Líderes */}
        <Link to="/admin/leaders" className="option-card">
          <div className="option-card-icon">
            <svg
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path d="M12 12a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm0 2c-3.33 0-6 1.34-6 3v1h12v-1c0-1.66-2.67-3-6-3Z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Líderes</h3>
            <p className="text-sm text-slate-500 mt-1">
              Asigna líderes a los ministerios y gestiona su información.
            </p>
          </div>
        </Link>

        {/* Eventos administrativos */}
        <Link to="/admin/events" className="option-card">
          <div className="option-card-icon">
            <svg
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              Eventos administrativos
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Crea y administra los eventos generales de la iglesia.
            </p>
          </div>
        </Link>

        {/* Configuración de eventos fijos */}
        <Link to="/admin/eventsconfig" className="option-card">
          <div className="option-card-icon">
            <svg
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path d="M12 6.5a1.5 1.5 0 1 1 1.06-.44A1.5 1.5 0 0 1 12 6.5Zm0 11a1.5 1.5 0 1 1 1.06-.44A1.5 1.5 0 0 1 12 17.5Zm0-5.5a1.5 1.5 0 1 1 1.06-.44A1.5 1.5 0 0 1 12 12Z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              Configurar eventos fijos
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Define eventos recurrentes y reglas especiales que se generarán
              automáticamente.
            </p>
          </div>
        </Link>

        {/* ✅ Reglas del calendario automático */}
        <Link to="/admin/calendar-rules" className="option-card">
          <div className="option-card-icon">
            <svg
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path d="M4 4h16v4H4Zm0 6h16v4H4Zm0 6h10v4H4Z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              Reglas del calendario
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Activa o desactiva las reglas que generan eventos automáticos
              (cultos, vigilias, ayunos, especiales, feriados).
            </p>
          </div>
        </Link>

        {/* ✅ Generar calendario anual */}
        <Link to="/admin/auto-calendar" className="option-card">
          <div className="option-card-icon">
            <svg
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" />
              <path d="M12 11v5m0 0-2-2m2 2 2-2" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              Generar calendario anual
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Crea automáticamente todos los eventos del año según las reglas
              activas del calendario.
            </p>
          </div>
        </Link>
      </div>

      {/* PRÓXIMOS EVENTOS (VISTA RÁPIDA PARA ADMIN) */}
      <div className="next-events max-w-3xl mx-auto">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">
          Próximos eventos de la iglesia
        </h2>

        {nextEvents.length === 0 ? (
          <p className="text-sm text-slate-500">
            No hay eventos próximos registrados.
          </p>
        ) : (
          nextEvents.map((ev) => (
            <div key={ev.id} className="next-event-item">
              <strong className="text-indigo-600">
                {formatDateLocal(ev.date_start)}
              </strong>{" "}
              —{" "}
              {ev.ministry_name ? (
                <>
                  <span className="uppercase tracking-wide text-slate-600">
                    {ev.ministry_name}
                  </span>{" "}
                  · {ev.title}
                </>
              ) : (
                ev.title
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
