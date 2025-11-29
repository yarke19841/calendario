// src/components/WeeklyServicesPanel.jsx

const LEGEND_ITEMS = [
  {
    label: "Feriado nacional",
    color: "#dc2626", // rojo
    description: "Feriados oficiales de Panamá",
  },
  {
    label: "Ayuno congregacional (jueves/sábado)",
    color: "#22c55e", // verde
    description: "Ayunos generales de la iglesia",
  },
  {
    label: "Semana de ayuno congregacional",
    color: "#15803d", // verde oscuro
    description: "Semana especial de ayuno del mes",
  },
  {
    label: "Cultos semanales",
    color: "#3b82f6", // azul
    description: "Domingo, miércoles y viernes",
  },
  {
    label: "Vigilias",
    color: "#7c3aed", // morado
    description: "Vigilias congregacionales y por ministerio",
  },
  {
    label: "Eventos especiales",
    color: "#eab308", // amarillo
    description: "Campañas, aniversarios, congresos, etc.",
  },
  {
    label: "Eventos congregacionales del año",
    color: "#06b6d4", // celeste
    description: "Eventos grandes del calendario anual",
  },
]

export default function WeeklyServicesPanel() {
  return (
    <div className="weekly-services">
      {/* 👇 mismo estilo que antes, pero texto nuevo */}
      <h3 className="weekly-services__title">
        Colores del calendario
      </h3>

      <p className="weekly-services__subtitle">
        Cada color representa un tipo de evento, varia si existen varios en el calendario general de la iglesia.
      </p>

      <ul className="weekly-services__list">
        {LEGEND_ITEMS.map((item) => (
          <li key={item.label} className="weekly-services__item">
            {/* 🔴 Puntito de color */}
            <span
              className="inline-block rounded-full"
              style={{
                width: "0.75rem",   // 12px
                height: "0.75rem",
                backgroundColor: item.color,
                marginRight: "0.35rem",
              }}
            />

            <span className="weekly-services__label">{item.label}</span>

            {item.description && (
              <span className="weekly-services__description">
                {" — "}{item.description}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
