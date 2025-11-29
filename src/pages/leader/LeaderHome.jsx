// src/pages/leader/LeaderHome.jsx
import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "../../lib/supabase"

export default function LeaderHome() {
  const [leaderName, setLeaderName] = useState("")
  const [ministryName, setMinistryName] = useState("General")
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [nextEvents, setNextEvents] = useState([])

  const navigate = useNavigate()

  async function logout() {
    await supabase.auth.signOut()
    localStorage.clear()
    navigate("/")
  }

  // 🔵 Formato de fecha SIN UTC, igual que en LeaderEvents
  function formatDateLocal(dateStr) {
    if (!dateStr) return ""

    const safe = String(dateStr).slice(0, 10) // "2025-11-29"
    const [y, m, d] = safe.split("-").map(Number)

    return new Date(y, m - 1, d).toLocaleDateString("es-PA", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
  }

  useEffect(() => {
    const loadData = async () => {
      const { data, error: authError } = await supabase.auth.getUser()
      const user = data?.user
      if (authError || !user) {
        console.error("Error auth LeaderHome:", authError)
        return
      }

      let displayName = ""
      let joinedMinistryName = "General"

      // 🔹 LEADER + ministries (igual que en LeaderEvents)
      try {
        const { data: leader, error: leaderError } = await supabase
          .from("leaders")
          .select(
            `
            name,
            ministry_id,
            ministries ( name )
          `
          )
          .eq("id", user.id) // usamos el mismo uuid de auth.users
          .maybeSingle()

        if (leaderError) {
          console.error("Error cargando leader:", leaderError)
        }

        if (leader?.name) {
          displayName = leader.name
        }

        joinedMinistryName = leader?.ministries?.name || "General"
        setMinistryName(joinedMinistryName)
      } catch (e) {
        console.error("Error inesperado consultando leaders:", e)
      }

      // 🔹 Si no hay nombre en leaders, usar metadata o correo
      if (!displayName) {
        displayName =
          user.user_metadata?.full_name ||
          user.email ||
          "Líder de la iglesia"
      }

      setLeaderName(displayName)

      const finalAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        displayName,
      )}&background=6366f1&color=fff&size=128`

      setAvatarUrl(finalAvatar || null)

      // 🔹 Próximos eventos (solo futuros creados por este líder)
      const today = new Date().toISOString().slice(0, 10)

      // 1) Traemos los eventos con ministry_id
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("id, title, date_start, ministry_id")
        .eq("created_by", user.id)
        .gte("date_start", today)
        .order("date_start", { ascending: true })
        .limit(5)

      if (eventsError) {
        console.error("Error cargando próximos eventos:", eventsError)
        setNextEvents([])
        return
      }

      // 2) Traemos ministerios y armamos un mapa
      const { data: ministriesData, error: ministriesError } = await supabase
        .from("ministries")
        .select("id, name")

      if (ministriesError) {
        console.error("Error cargando ministerios:", ministriesError)
      }

      const ministryMap = {}
      ;(ministriesData || []).forEach((m) => {
        ministryMap[m.id] = m.name
      })

      // 3) Adjuntamos ministry_name a cada evento
      const eventsWithMinistry = (eventsData || []).map((ev) => ({
        ...ev,
        ministry_name:
          ministryMap[ev.ministry_id] || joinedMinistryName || "Sin ministerio",
      }))

      setNextEvents(eventsWithMinistry)
    }

    loadData()
  }, [])

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      {/* HEADER */}
      <div className="leader-header">
        <img
          src={avatarUrl || undefined}
          alt="avatar líder"
          className="leader-avatar"
        />

        <div className="flex-1">
          <h1>Hola, {leaderName}</h1>
          <p>
            {ministryName
              ? `Ministerio: ${ministryName}`
              : "Líder de la iglesia"}
          </p>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 text-sm bg-white text-indigo-600 rounded-full shadow hover:bg-indigo-50 transition"
        >
          Cerrar sesión
        </button>
      </div>

      {/* CARDS PRINCIPALES */}
      <div className="mt-10 grid gap-6 max-w-3xl mx-auto">
        <Link to="/calendar" className="option-card">
          <div className="option-card-icon">
            <svg
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              Ver Calendario
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Consulta todas las actividades de la iglesia.
            </p>
          </div>
        </Link>

        <Link to="/leader/events" className="option-card">
          <div className="option-card-icon">
            <svg
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path d="M12 20h9m-9 0l-3-3m3 3l3-3m-3 3V4" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              Mis Eventos
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Crea nuevos eventos o revisa los que ya registraste.
            </p>
          </div>
        </Link>
      </div>

      {/* PRÓXIMOS EVENTOS */}
      <div className="next-events max-w-3xl mx-auto">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">
          Próximos eventos
        </h2>

        {nextEvents.length === 0 ? (
          <p className="text-sm text-slate-500">No tienes eventos próximos.</p>
        ) : (
          nextEvents.map((ev) => (
            <div key={ev.id} className="next-event-item">
              <strong className="text-indigo-600">
                {formatDateLocal(ev.date_start)}
              </strong>{" "}
              — [{ev.ministry_name}] {ev.title}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
