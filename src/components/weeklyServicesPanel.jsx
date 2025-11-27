// src/components/WeeklyServicesPanel.jsx
import { WEEKLY_SERVICES } from "../config/weeklyServices"

export default function WeeklyServicesPanel() {
  return (
    <div className="weekly-services">
      <h3 className="weekly-services__title">
        Cultos semanales (automáticos)
      </h3>

      <p className="weekly-services__subtitle">
        Estos cultos se generan automáticamente todas las semanas en el
        calendario general.
      </p>

      <ul className="weekly-services__list">
        {WEEKLY_SERVICES.map((service) => (
          <li key={service.id} className="weekly-services__item">
            <span className="weekly-services__label">🕊 {service.label}</span>
            <span className="weekly-services__time"> • {service.time}</span>
            {service.description && (
              <span className="weekly-services__description">
                {" "}
                — {service.description}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
