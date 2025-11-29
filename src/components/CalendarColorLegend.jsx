export default function CalendarColorLegend() {
  const items = [
    { label: "Feriado nacional", color: "#dc2626" }, // Rojo
    {
      label: "Ayuno congregacional (jueves/sábado)",
      color: "#22c55e", // Verde
    },
    {
      label: "Semana de ayuno congregacional",
      color: "#15803d", // Verde oscuro
    },
    { label: "Cultos semanales", color: "#3b82f6" }, // Azul
    { label: "Vigilias", color: "#7c3aed" }, // Morado
    { label: "Eventos especiales", color: "#eab308" }, // Amarillo
    {
      label: "Eventos congregacionales del año",
      color: "#06b6d4", // Celeste
    },
  ]

  return (
    <div className="mt-6 mb-8">
      <h3 className="text-lg font-semibold text-slate-800 mb-3">
        Leyenda de colores del calendario
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span
              className="inline-block rounded-full"
              style={{
                backgroundColor: item.color,
                width: "0.75rem",   // 12px
                height: "0.75rem",
              }}
            />
            <span className="text-slate-700">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
