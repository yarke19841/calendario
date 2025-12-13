// src/utils/exportICS.js

// -----------------------------
// UTILIDAD: generar archivo ICS
// -----------------------------
export function exportToICS(events, fileName = "calendario-imj.ics") {
  if (!events || events.length === 0) {
    alert("No hay eventos para exportar.")
    return
  }

  let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//IMJ//Calendario Digital//ES
CALSCALE:GREGORIAN
METHOD:PUBLISH
`

  events.forEach((evt) => {
    const startDate = formatDateToICSDateOnly(evt.date_start)
    const endDate = formatDateToICSDateOnly(evt.date_end || evt.date_start)

    if (!startDate) {
      return // si por alguna razón no tiene fecha, lo saltamos
    }

    const uid =
      evt.id ||
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Math.random()).slice(2))

    ics += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${formatDateTimeUTC(new Date())}
DTSTART;VALUE=DATE:${startDate}
DTEND;VALUE=DATE:${endDate}
SUMMARY:${escapeICS(evt.title || evt.name || "Sin título")}
DESCRIPTION:${escapeICS(evt.description || "")}
END:VEVENT
`
  })

  ics += `END:VCALENDAR`

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  link.click()
}

// -----------------------------
// FUNCIONES DE APOYO
// -----------------------------

// 🔹 Fechas de DÍA COMPLETO (sin hora, sin Z)
function formatDateToICSDateOnly(dateInput) {
  if (!dateInput) return ""

  let y, m, d

  if (typeof dateInput === "string") {
    const safe = dateInput.slice(0, 10) // "YYYY-MM-DD"
    ;[y, m, d] = safe.split("-")
  } else if (dateInput instanceof Date) {
    y = dateInput.getFullYear().toString().padStart(4, "0")
    m = String(dateInput.getMonth() + 1).padStart(2, "0")
    d = String(dateInput.getDate()).padStart(2, "0")
  } else {
    return ""
  }

  if (!y || !m || !d) return ""
  return `${y}${m}${d}` // YYYYMMDD
}

// 🔹 Para DTSTAMP sí usamos UTC con Z (no afecta al día del evento)
function formatDateTimeUTC(dateInput) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput)

  return (
    d.getUTCFullYear().toString().padStart(4, "0") +
    String(d.getUTCMonth() + 1).padStart(2, "0") +
    String(d.getUTCDate()).padStart(2, "0") +
    "T" +
    String(d.getUTCHours()).padStart(2, "0") +
    String(d.getUTCMinutes()).padStart(2, "0") +
    String(d.getUTCSeconds()).padStart(2, "0") +
    "Z"
  )
}

function escapeICS(str) {
  return String(str)
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\n/g, "\\n")
}
