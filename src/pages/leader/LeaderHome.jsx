import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "../../lib/supabase"

export default function LeaderHome() {
  const [leaderName, setLeaderName] = useState("")
  const [ministryName, setMinistryName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [nextEvents, setNextEvents] = useState([])

  const navigate = useNavigate()

  async function logout() {
    await supabase.auth.signOut()
    localStorage.clear()
    navigate("/")
  }

  // 🔵 Formato de fecha SIN UTC, igual que en LeaderEvents
  function formatDateLocal(dateStr) {
  if (!dateStr) return "";

  // Extrae YYYY-MM-DD aunque venga con zona horaria o milisegundos
  const safe = dateStr.slice(0, 10); // "2025-11-29"

  const [y, m, d] = safe.split("-").map(Number);

  return new Date(y, m - 1, d).toLocaleDateString("es-PA", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}


  useEffect(() => {
    const loadData = async () => {
      const session = await supabase.auth.getUser()
      const user = session?.data?.user
      if (!user) return

      let displayName = ""
      let profileAvatar = ""
      let leaderAvatar = ""
      let ministryId = null

      // Perfil (nombre / avatar)
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle()

      if (profile?.full_name) displayName = profile.full_name
      if (profile?.avatar_url) profileAvatar = profile.avatar_url

      // Leader (nombre + ministry_id + avatar del líder)
      const { data: leader } = await supabase
        .from("leaders")
        .select("name, ministry_id, avatar_url")
        .eq("auth_user_id", user.id)
        .maybeSingle()

      if (leader?.name && !displayName) displayName = leader.name
      if (leader?.avatar_url) leaderAvatar = leader.avatar_url
      if (leader?.ministry_id) ministryId = leader.ministry_id

      if (!displayName) displayName = user.email || "Líder"
      setLeaderName(displayName)

      // Ministerio
      if (ministryId) {
        const { data: ministry } = await supabase
          .from("ministries")
          .select("name")
          .eq("id", ministryId)
          .maybeSingle()

        if (ministry?.name) setMinistryName(ministry.name)
      }

      // Avatar final
      const finalAvatar =
        leaderAvatar ||
        profileAvatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          displayName
        )}&background=6366f1&color=fff&size=128`

      setAvatarUrl(finalAvatar)

      // 🔵 Próximos eventos (solo eventos futuros)
      const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

      const { data: events } = await supabase
        .from("events")
        .select("title, date_start")
        .eq("created_by", user.id)
        .gte("date_start", today) // evita el desfase
        .order("date_start", { ascending: true })
        .limit(5)

      setNextEvents(events || [])
    }

    loadData()
  }, [])

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      {/* HEADER */}
      <div className="leader-header">
        <img src={avatarUrl} alt="avatar líder" className="leader-avatar" />

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
            <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Ver Calendario</h3>
            <p className="text-sm text-slate-500 mt-1">
              Consulta todas las actividades de la iglesia.
            </p>
          </div>
        </Link>

        <Link to="/leader/events" className="option-card">
          <div className="option-card-icon">
            <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M12 20h9m-9 0l-3-3m3 3l3-3m-3 3V4" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Mis Eventos</h3>
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
          nextEvents.map((ev, i) => (
            <div key={i} className="next-event-item">
              <strong className="text-indigo-600">
                {formatDateLocal(ev.date_start)}
              </strong>{" "}
              — {ev.title}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
