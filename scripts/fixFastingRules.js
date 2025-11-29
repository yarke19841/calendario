// scripts/fixFastingRules.js
import "dotenv/config"
import { createClient } from "@supabase/supabase-js"

// ⚠️ Usa la SERVICE ROLE KEY (no la anon) en tu .env:
// SUPABASE_URL=...
// SUPABASE_SERVICE_ROLE_KEY=...
console.log("¿SUPABASE_URL existe?:", !!process.env.SUPABASE_URL)
console.log(
  "¿SERVICE_ROLE (longitud aprox)?:",
  process.env.SUPABASE_SERVICE_ROLE_KEY?.length
)


const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const YEARS = [2025, 2026]
const GREEN = "#22c55e" // verde para ayuno congregacional

function addDays(date, days) {
  const d = new Date(date.getTime())
  d.setDate(d.getDate() + days)
  return d
}

function toIsoDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

// 🟢 1) Poner color verde a TODOS los ayunos congregacionales 2025-2026
async function colorAllAyunos() {
  const { error } = await supabase
    .from("events")
    .update({ color: GREEN })
    .eq("is_generated", true)
    .in("title", ["Ayuno congregacional", "Semana de ayuno congregacional"])
    .gte("date_start", "2025-01-01")
    .lte("date_start", "2026-12-31")

  if (error) throw error
  console.log("✔ Colores de ayuno congregacional actualizados a verde.")
}

// 🔴 2) Borrar ayuno del sábado después de cada vigilia congregacional
async function removeSaturdayAfterVigilia() {
  const { data: vigils, error } = await supabase
    .from("events")
    .select("id, date_start")
    .eq("title", "Vigilia congregacional")
    .eq("is_generated", true)
    .gte("date_start", "2025-01-01")
    .lte("date_start", "2026-12-31")

  if (error) throw error

  console.log(`Encontradas ${vigils.length} vigilias para procesar.`)

  for (const v of vigils) {
    const fridayDate = new Date(v.date_start)
    const saturday = addDays(fridayDate, 1)
    const saturdayStr = toIsoDate(saturday)

    const { error: delError } = await supabase
      .from("events")
      .delete()
      .eq("title", "Ayuno congregacional")
      .eq("is_generated", true)
      .eq("date_start", saturdayStr)

    if (delError) throw delError
    console.log(`✔ Eliminado ayuno del sábado ${saturdayStr} (después de vigilia).`)
  }
}

// 🟣 helper: primer lunes de un mes (month: 0–11)
function firstMondayOfMonth(year, month) {
  const d = new Date(year, month, 1)
  // getDay() -> 0=domingo, 1=lunes, ...
  while (d.getDay() !== 1) {
    d.setDate(d.getDate() + 1)
  }
  return d
}

// Buscar un ayuno existente para copiar ministry_id / type / status
async function getSampleAyunoTemplate() {
  const { data, error } = await supabase
    .from("events")
    .select("ministry_id, type, status")
    .eq("title", "Ayuno congregacional")
    .eq("is_generated", true)
    .not("ministry_id", "is", null)
    .limit(1)
    .maybeSingle()

  if (error) throw error

  if (!data) {
    // fallback genérico
    return {
      ministry_id: null,
      type: "MINISTERIAL",
      status: "APROBADO",
    }
  }

  return data
}

// 🔵 3) Crear / ajustar Semana de ayuno congregacional
async function createOrUpdateSemanaAyuno() {
  const template = await getSampleAyunoTemplate()
  console.log("Plantilla para semana de ayuno:", template)

  for (const year of YEARS) {
    for (let month = 0; month < 12; month++) {
      const baseMonday = firstMondayOfMonth(year, month)
      const days = []

      // lunes a sábado (6 días)
      for (let i = 0; i < 6; i++) {
        const d = addDays(baseMonday, i)
        // por si acaso se llegara a salir del mes (no debería)
        if (d.getMonth() !== month) continue
        days.push(d)
      }

      console.log(
        `Mes ${year}-${String(month + 1).padStart(2, "0")}: Semana de ayuno del ${toIsoDate(
          days[0]
        )} al ${toIsoDate(days[days.length - 1])}`
      )

      for (const d of days) {
        const dateStr = toIsoDate(d)

        // ¿Hay ya un Ayuno congregacional generado ese día?
        const { data: existing, error: selErr } = await supabase
          .from("events")
          .select("id, title")
          .eq("is_generated", true)
          .eq("date_start", dateStr)
          .in("title", ["Ayuno congregacional", "Semana de ayuno congregacional"])
          .maybeSingle()

        if (selErr) throw selErr

        if (existing) {
          // Actualizar a "Semana de ayuno congregacional" + color verde
          const { error: updErr } = await supabase
            .from("events")
            .update({
              title: "Semana de ayuno congregacional",
              color: GREEN,
            })
            .eq("id", existing.id)

          if (updErr) throw updErr
          console.log(`✔ Actualizado ${dateStr} a "Semana de ayuno congregacional".`)
        } else {
          // Insertar nuevo evento para ese día
          const { error: insErr } = await supabase.from("events").insert({
            title: "Semana de ayuno congregacional",
            description: null,
            ministry_id: template.ministry_id,
            type: template.type,
            status: template.status,
            date_start: dateStr,
            date_end: dateStr,
            all_day: true,
            created_by: null, // congregacional (no de un usuario)
            color: GREEN,
            is_generated: true,
            is_fixed: true,
          })

          if (insErr) throw insErr
          console.log(`✔ Insertado "Semana de ayuno congregacional" en ${dateStr}.`)
        }
      }
    }
  }
}

async function main() {
  try {
    console.log("=== Corrigiendo reglas de ayuno 2025-2026 ===")
    await colorAllAyunos()
    await removeSaturdayAfterVigilia()
    await createOrUpdateSemanaAyuno()
    console.log("✅ Listo. Revisa el calendario en 2025 y 2026.")
  } catch (err) {
    console.error("❌ Error corrigiendo reglas:", err)
  }
}

main()
