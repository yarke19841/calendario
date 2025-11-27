// src/config/weeklyServices.js
export const WEEKLY_SERVICES = [
  {
    id: "sunday_service",
    dayOfWeek: 0, // 0 = domingo
    label: "Culto de Domingo",
    time: "7:00 AM",
    description: "Culto general congregacional",
  },
  {
    id: "wednesday_service",
    dayOfWeek: 3, // 3 = miércoles
    label: "Culto de Miércoles",
    time: "7:00 PM",
    description: "Culto general de mitad de semana",
  },
  {
    id: "friday_service",
    dayOfWeek: 5, // 5 = viernes
    label: "Culto de Viernes",
    time: "7:00 PM",
    description: "Culto general de fin de semana",
  },
]
