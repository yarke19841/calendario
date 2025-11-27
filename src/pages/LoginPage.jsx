// src/pages/Login.jsx
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // 1. LOGIN CON SUPABASE AUTH
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log("Auth user =>", user)
      console.log("Auth error =>", authError)

      if (authError) {
        throw new Error("Usuario o contraseña incorrectos")
      }

      if (!user) {
        throw new Error("No se pudo obtener el usuario autenticado")
      }

      // 2. BUSCAR PERFIL EN LEADERS POR auth_user_id
      let { data: leader, error: leaderError } = await supabase
        .from("leaders")
        .select("id, name, role, ministry_id, auth_user_id")
        .eq("auth_user_id", user.id) // 👈 ENLAZADO CON AUTH
        .maybeSingle()

      console.log("Leader data =>", leader)
      console.log("Leader error =>", leaderError)

      // 3. SI NO EXISTE LÍDER Y ES admin@gmail.com, LO CREAMOS AUTOMÁTICO
      if (!leader && !leaderError && user.email === "admin@gmail.com") {
        console.log("No había leader, creando uno para admin...")

        const { data: newLeader, error: upsertError } = await supabase
          .from("leaders")
          .upsert(
            {
              auth_user_id: user.id,
              name: "Admin General",
              role: "admin",
              ministry_id: null,
            },
            { onConflict: "auth_user_id" }
          )
          .select("id, name, role, ministry_id, auth_user_id")
          .single()

        if (upsertError) {
          console.error("Error al crear leader admin:", upsertError)
          throw new Error("No se pudo crear el perfil de líder para admin.")
        }

        leader = newLeader
        console.log("Leader creado =>", leader)
      }

      // 4. SI HAY ERROR EN LA CONSULTA A LEADERS
      if (leaderError) {
        console.error("Leader error final =>", leaderError)
        throw new Error("Error interno al cargar el perfil de líder.")
      }

      // 5. SI SIGUE SIN HABER LÍDER (NO ES ADMIN O NO ESTÁ CONFIGURADO)
      if (!leader) {
        alert("No estás registrado como líder en la iglesia. " + user.id)
        throw new Error("Tu usuario no tiene perfil de líder configurado.")
      }

      // Normalizamos el rol para evitar problemas de mayúsculas/espacios
      const role = (leader.role || "").toLowerCase().trim()

      // 6. GUARDAR INFO EN LOCALSTORAGE
      localStorage.setItem("user_id", user.id)
      localStorage.setItem("user_email", user.email ?? "")
      localStorage.setItem("leader_name", leader.name ?? "")
      localStorage.setItem("leader_role", role)
      if (leader.ministry_id) {
        localStorage.setItem("ministry_id", leader.ministry_id)
      }

      console.log("🔥 Rol normalizado:", role)

      // 7. REDIRIGIR SEGÚN ROL
      if (role === "admin") {
        navigate("/admin")   // Panel admin
      } else {
        navigate("/leader")  // ✅ Panel líder (antes era /dashboard)
      }
    } catch (err) {
      console.error("Error en login completo =>", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#0f172a",
        padding: "1rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "white",
          borderRadius: 16,
          padding: "1.5rem 2rem",
          boxShadow:
            "0 20px 25px -5px rgba(15,23,42,0.25), 0 10px 10px -5px rgba(15,23,42,0.2)",
        }}
      >
        <h1
          style={{
            margin: 0,
            marginBottom: "0.5rem",
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "#0f172a",
          }}
        >
          Calendario Iglesia
        </h1>
        <p style={{ marginTop: 0, marginBottom: "1.5rem", color: "#64748b" }}>
          Inicia sesión con tu correo registrado.
        </p>

        {error && (
          <div
            style={{
              marginBottom: "1rem",
              padding: "0.75rem 1rem",
              borderRadius: 8,
              background: "#fef2f2",
              color: "#b91c1c",
              fontSize: "0.9rem",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
          <div style={{ display: "grid", gap: "0.25rem" }}>
            <label
              htmlFor="email"
              style={{ fontSize: "0.9rem", fontWeight: 600, color: "#0f172a" }}
            >
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                borderRadius: 8,
                border: "1px solid #cbd5f5",
                padding: "0.55rem 0.75rem",
                fontSize: "0.95rem",
              }}
            />
          </div>

          <div style={{ display: "grid", gap: "0.25rem" }}>
            <label
              htmlFor="password"
              style={{ fontSize: "0.9rem", fontWeight: 600, color: "#0f172a" }}
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                borderRadius: 8,
                border: "1px solid #cbd5f5",
                padding: "0.55rem 0.75rem",
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
              padding: "0.6rem 1rem",
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: loading ? "wait" : "pointer",
              background:
                "linear-gradient(to right, #4f46e5, #6366f1, #8b5cf6)",
              color: "white",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Entrando..." : "Iniciar sesión"}
          </button>
        </form>

        <p
          style={{
            marginTop: "1.25rem",
            fontSize: "0.8rem",
            color: "#94a3b8",
            textAlign: "center",
          }}
        >
          Si tienes problemas para entrar, habla con el administrador del
          calendario.
        </p>
      </div>
    </div>
  )
}
