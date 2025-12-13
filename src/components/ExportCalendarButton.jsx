// src/components/ExportCalendarButton.jsx
import { useState } from "react"
import { supabase } from "../lib/supabase"

function formatDateForICS(dateStr) {
  if (!dateStr) return ""
  const safe = String(dateStr).slice(0, 10) // "YYYY-MM-DD"
  return safe.replace(/-/g, "")            // "YYYYMMDD"
}

function escapeICS(str = "") {
  return String(str)
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\r?\n/g, "\\n")
}

function buildICS(events = []) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//IMJ//Calendario 2026//ES",
    "CALSCALE:GREGORIAN",
  ]

  for (const evt of events) {
    const dtStart = formatDateForICS(evt.date_start)
    const dtEnd = formatDateForICS(evt.date_end || evt.date_start)
    const uid = `${evt.id}@calendario-imj`
    const ministryName = evt.ministries?.name || "" // ajusta al alias real del join
    const summaryText = `${evt.title || ""}${ministryName ? " - " + ministryName : ""}`

    lines.push("BEGIN:VEVENT")
    lines.push(`UID:${uid}`)
    lines.push(`DTSTART;VALUE=DATE:${dtStart}`)
    lines.push(`DTEND;VALUE=DATE:${dtEnd}`)
    lines.push(`SUMMARY:${escapeICS(summaryText)}`)
    if (evt.description) lines.push(`DESCRIPTION:${escapeICS(evt.description)}`)
    if (evt.location) lines.push(`LOCATION:${escapeICS(evt.location)}`)
    lines.push("END:VEVENT")
  }

  lines.push("END:VCALENDAR")
  return lines.join("\r\n")
}

export default function ExportCalendarButton() {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    try {
      setLoading(true)

      const { data: events, error } = await supabase
        .from("events")
        .select("id, title, description, date_start, date_end, location, ministries(name)")
        .order("date_start", { ascending: true })

      if (error) {
        console.error(error)
        alert("No se pudieron cargar los eventos 😢")
        return
      }

      const icsContent = buildICS(events || [])
      const blob = new Blob([icsContent], {
        type: "text/calendar;charset=utf-8",
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "calendario-imj-2026.ics"
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      className="btn-primary"
      onClick={handleExport}
      disabled={loading}
    >
      {loading ? "Generando archivo..." : "Exportar calendario (.ics)"}
    </button>
  )
}
