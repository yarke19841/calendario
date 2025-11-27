// src/utils/panamaHolidays.js

// Devuelve "YYYY-MM-DD"
function toKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

// Festivos fijos por día y mes (sin año)
const FIXED_HOLIDAYS = [
  { month: 1, day: 1, name: "Año Nuevo" },
  { month: 1, day: 9, name: "Día de los Mártires" },
  { month: 5, day: 1, name: "Día del Trabajador" },
  { month: 11, day: 3, name: "Separación de Panamá de Colombia" },
  { month: 11, day: 4, name: "Día de la Bandera" },
  { month: 11, day: 5, name: "Consolidación de la Separación" },
  { month: 11, day: 10, name: "Grito de La Villa de Los Santos" },
  { month: 11, day: 28, name: "Independencia de Panamá de España" },
  { month: 12, day: 8, name: "Día de las Madres" },
  { month: 12, day: 25, name: "Navidad" },
]

export function getPanamaHoliday(date) {
  if (!(date instanceof Date)) {
    return {
      isHoliday: false,
      name: null,
      key: null,
    }
  }

  const month = date.getMonth() + 1
  const day = date.getDate()

  const fixed = FIXED_HOLIDAYS.find(
    (h) => h.month === month && h.day === day,
  )

  if (fixed) {
    return {
      isHoliday: true,
      name: fixed.name,
      key: toKey(date),
    }
  }

  // Aquí luego puedes agregar Día del Padre, etc. si quieres marcarlo igual.
  return {
    isHoliday: false,
    name: null,
    key: toKey(date),
  }
}
