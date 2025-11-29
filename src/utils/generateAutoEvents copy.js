// src/utils/generateAutoEvents.js

// Formatea Date -> "YYYY-MM-DD"
function formatDate(dateObj) {
  const y = dateObj.getFullYear()
  const m = String(dateObj.getMonth() + 1).padStart(2, "0")
  const d = String(dateObj.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function addDays(dateObj, days) {
  const d = new Date(dateObj)
  d.setDate(d.getDate() + days)
  return d
}

// n-ésimo día de la semana en un mes (1 = primero, 2 = segundo, etc.)
function getNthWeekdayOfMonth(year, monthIndex, weekday, n) {
  const date = new Date(year, monthIndex, 1)
  while (date.getDay() !== weekday) {
    date.setDate(date.getDate() + 1)
  }
  date.setDate(date.getDate() + 7 * (n - 1))
  return date
}

// Último día de la semana en un mes (ej: último viernes)
function getLastWeekdayOfMonth(year, monthIndex, weekday) {
  const date = new Date(year, monthIndex + 1, 0) // último día del mes
  while (date.getDay() !== weekday) {
    date.setDate(date.getDate() - 1)
  }
  return date
}

// Helper para crear evento con la forma que usa AdminAutoCalendar
function makeEvent({
  date,
  title,
  time = null,
  description = null,
  type = "especial",
  rule_key,
  is_global = true,
}) {
  return {
    date,
    title,
    time,
    description,
    type, // "culto" | "ayuno" | "vigilia" | "feriado" | "especial"
    rule_key,
    is_global,
  }
}

/**
 * Genera TODOS los eventos automáticos del año
 * usando las reglas activas (enabledRuleKeys).
 *
 * enabledRuleKeys = [ 'weekly_sunday_service', 'national_holiday', ... ]
 */
export function generateAutoEventsForYear(year, enabledRuleKeys = null) {
  const yearInt = parseInt(year, 10)
  if (isNaN(yearInt) || yearInt < 2000 || yearInt > 2100) {
    throw new Error("Año inválido para generación de calendario")
  }

  const enabledSet = Array.isArray(enabledRuleKeys)
    ? new Set(enabledRuleKeys)
    : null

  const useRule = (key) =>
    !enabledSet ? true : enabledSet.has(key)

  let events = []

  // ------------------------------------
  // 1) CULTOS SEMANALES (DOM, MIÉ, VIE)
  // ------------------------------------
  if (
    useRule("weekly_sunday_service") ||
    useRule("weekly_wednesday_service") ||
    useRule("weekly_friday_service")
  ) {
    const start = new Date(yearInt, 0, 1)
    const end = new Date(yearInt, 11, 31)
    let current = new Date(start)

    while (current <= end) {
      const day = current.getDay() // 0=Dom, 3=Mié, 5=Vie
      const dateStr = formatDate(current)

      if (day === 0 && useRule("weekly_sunday_service")) {
        events.push(
          makeEvent({
            date: dateStr,
            title: "Culto de domingo (7:00 AM)",
            time: "07:00",
            type: "culto",
            rule_key: "weekly_sunday_service",
          }),
        )
      }

      if (day === 3 && useRule("weekly_wednesday_service")) {
        events.push(
          makeEvent({
            date: dateStr,
            title: "Culto de miércoles",
            time: "19:30",
            type: "culto",
            rule_key: "weekly_wednesday_service",
          }),
        )
      }

      if (day === 5 && useRule("weekly_friday_service")) {
        events.push(
          makeEvent({
            date: dateStr,
            title: "Culto de viernes",
            time: "19:30",
            type: "culto",
            rule_key: "weekly_friday_service",
          }),
        )
      }

      current.setDate(current.getDate() + 1)
    }
  }

  // ------------------------------
  // 2) AYUNOS CONGREGACIONALES
  // ------------------------------
  if (
    useRule("weekly_thursday_fast") ||
    useRule("weekly_saturday_fast")
  ) {
    const start = new Date(yearInt, 0, 1)
    const end = new Date(yearInt, 11, 31)
    let current = new Date(start)

    while (current <= end) {
      const day = current.getDay() // 4=Jueves, 6=Sábado
      const dateStr = formatDate(current)

      if (day === 4 && useRule("weekly_thursday_fast")) {
        events.push(
          makeEvent({
            date: dateStr,
            title: "Ayuno congregacional (jueves)",
            type: "ayuno",
            rule_key: "weekly_thursday_fast",
          }),
        )
      }

      if (day === 6 && useRule("weekly_saturday_fast")) {
        events.push(
          makeEvent({
            date: dateStr,
            title: "Ayuno congregacional (sábado)",
            type: "ayuno",
            rule_key: "weekly_saturday_fast",
          }),
        )
      }

      current.setDate(current.getDate() + 1)
    }
  }

  // ------------------------------------
  // 3) SANTA CENA (1er DOMINGO DE MES)
  // ------------------------------------
  if (useRule("monthly_santa_cena")) {
    for (let month = 0; month < 12; month++) {
      const sunday = getNthWeekdayOfMonth(yearInt, month, 0, 1) // 0=Domingo
      events.push(
        makeEvent({
          date: formatDate(sunday),
          title: "Santa Cena",
          type: "especial",
          rule_key: "monthly_santa_cena",
        }),
      )
    }
  }

  // ------------------------------------
  // 4) PRIMER VIERNES DEL MES
  //    - Arrojando Coronas
  //    - Venta de comida (Alabanza)
  // ------------------------------------
  if (
    useRule("monthly_arrojando_coronas") ||
    useRule("monthly_food_sale_alabanza")
  ) {
    for (let month = 0; month < 12; month++) {
      const firstFriday = getNthWeekdayOfMonth(yearInt, month, 5, 1) // 5=Viernes
      const dateStr = formatDate(firstFriday)

      if (useRule("monthly_arrojando_coronas")) {
        events.push(
          makeEvent({
            date: dateStr,
            title: "Arrojando Coronas",
            type: "especial",
            rule_key: "monthly_arrojando_coronas",
          }),
        )
      }

      if (useRule("monthly_food_sale_alabanza")) {
        events.push(
          makeEvent({
            date: dateStr,
            title: "Venta de comida (Alabanza)",
            type: "especial",
            rule_key: "monthly_food_sale_alabanza",
          }),
        )
      }
    }
  }

  // ------------------------------
  // 5) VIGILIAS
  //    - 2do viernes: diáconos
  //    - 3er viernes: ministerios
  //    - último viernes: congregacional
  // ------------------------------
  if (
    useRule("monthly_vigilia_diaconos") ||
    useRule("monthly_vigilia_ministerios") ||
    useRule("monthly_vigilia_congregacional")
  ) {
    for (let month = 0; month < 12; month++) {
      // 2do viernes
      if (useRule("monthly_vigilia_diaconos")) {
        const secondFriday = getNthWeekdayOfMonth(yearInt, month, 5, 2)
        events.push(
          makeEvent({
            date: formatDate(secondFriday),
            title: "Vigilia de diáconos",
            time: "22:00",
            type: "vigilia",
            rule_key: "monthly_vigilia_diaconos",
          }),
        )
      }

      // 3er viernes
      if (useRule("monthly_vigilia_ministerios")) {
        const thirdFriday = getNthWeekdayOfMonth(yearInt, month, 5, 3)
        events.push(
          makeEvent({
            date: formatDate(thirdFriday),
            title: "Vigilia de ministerios",
            time: "22:00",
            type: "vigilia",
            rule_key: "monthly_vigilia_ministerios",
          }),
        )
      }

      // último viernes
      if (useRule("monthly_vigilia_congregacional")) {
        const lastFriday = getLastWeekdayOfMonth(yearInt, month, 5)
        events.push(
          makeEvent({
            date: formatDate(lastFriday),
            title: "Vigilia congregacional",
            time: "22:00",
            type: "vigilia",
            rule_key: "monthly_vigilia_congregacional",
          }),
        )
      }
    }
  }

  // ------------------------------
  // 6) LUZ Y VIDA (último sábado de octubre)
  // ------------------------------
  if (useRule("october_luz_y_vida")) {
    const lastSaturdayOct = getLastWeekdayOfMonth(yearInt, 9, 6) // octubre = 9, sábado=6
    events.push(
      makeEvent({
        date: formatDate(lastSaturdayOct),
        title: "Luz y Vida",
        type: "especial",
        rule_key: "october_luz_y_vida",
      }),
    )
  }

  // ------------------------------
  // 7) CULTOS ESPECIALES DE ENERO
  //    - Culto de unción (primer domingo del año, excepto 1 de enero)
  //    - Compromiso de santidad (último domingo de enero)
  //    - Ayuno de Daniel (10–25 enero)
  // ------------------------------
  if (useRule("yearly_culto_uncion")) {
    // primer domingo de enero
    let firstSunday = getNthWeekdayOfMonth(yearInt, 0, 0, 1)
    if (firstSunday.getDate() === 1) {
      // si cayó 1 de enero, usar el segundo domingo
      firstSunday = getNthWeekdayOfMonth(yearInt, 0, 0, 2)
    }

    events.push(
      makeEvent({
        date: formatDate(firstSunday),
        title: "Culto de unción de inicio de año",
        type: "especial",
        rule_key: "yearly_culto_uncion",
      }),
    )
  }

  if (useRule("yearly_compromiso_santidad")) {
    const lastSundayJan = getLastWeekdayOfMonth(yearInt, 0, 0)
    events.push(
      makeEvent({
        date: formatDate(lastSundayJan),
        title: "Compromiso de santidad",
        type: "especial",
        rule_key: "yearly_compromiso_santidad",
      }),
    )
  }

  if (useRule("yearly_ayuno_daniel")) {
    // 10 al 25 de enero
    for (let day = 10; day <= 25; day++) {
      const d = new Date(yearInt, 0, day)
      events.push(
        makeEvent({
          date: formatDate(d),
          title: "Ayuno de Daniel",
          type: "ayuno",
          rule_key: "yearly_ayuno_daniel",
        }),
      )
    }
  }

  // ------------------------------
  // 8) FERIADOS NACIONALES DE PANAMÁ
  // ------------------------------
  if (useRule("national_holiday")) {
    const holidays = [
      { month: 1, day: 1, title: "Año Nuevo" },
      { month: 1, day: 9, title: "Día de los Mártires" },
      { month: 5, day: 1, title: "Día del Trabajador" },
      { month: 11, day: 3, title: "Separación de Panamá de Colombia" },
      { month: 11, day: 4, title: "Día de la Bandera" },
      { month: 11, day: 5, title: "Consolidación de la Separación" },
      { month: 11, day: 10, title: "Grito de La Villa de Los Santos" },
      { month: 11, day: 28, title: "Independencia de Panamá de España" },
      { month: 12, day: 8, title: "Día de las Madres" },
      { month: 12, day: 25, title: "Navidad" },
    ]

    for (const h of holidays) {
      const d = new Date(yearInt, h.month - 1, h.day)
      events.push(
        makeEvent({
          date: formatDate(d),
          title: h.title,
          type: "feriado",
          rule_key: "national_holiday",
        }),
      )
    }
  }

  // ------------------------------
  // 9) DÍA DEL PADRE – 3er domingo de junio
  // ------------------------------
  if (useRule("day_father_panama")) {
    const thirdSundayJune = getNthWeekdayOfMonth(yearInt, 5, 0, 3) // junio=5, domingo=0, 3er
    events.push(
      makeEvent({
        date: formatDate(thirdSundayJune),
        title: "Día del Padre (Panamá)",
        type: "especial",
        rule_key: "day_father_panama",
      }),
    )
  }

  // --------------------------------
  // Eliminar duplicados (date + title + rule_key)
  // --------------------------------
  const unique = []
  const seen = new Set()

  for (const ev of events) {
    const key = `${ev.date}__${ev.title}__${ev.rule_key}`
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(ev)
    }
  }

  return unique
}
