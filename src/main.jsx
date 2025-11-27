// src/main.jsx
import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Routes, Route } from "react-router-dom"

import LoginPage from "./pages/LoginPage.jsx"
import CalendarPage from "./pages/CalendarPage.jsx"

/* ADMIN */
import AdminHome from "./pages/admin/AdminHome.jsx"
import AdminMinistries from "./pages/admin/AdminMinistries.jsx"
import AdminLeaders from "./pages/admin/AdminLeaders.jsx"
import AdminEvents from "./pages/admin/AdminEvents.jsx"
import AdminEventsConfig from "./pages/admin/AdminEventsConfig.jsx"
import AdminCalendarRules from "./pages/admin/AdminCalendarRules.jsx"
import AdminAutoCalendar from "./pages/admin/AdminAutoCalendar.jsx"

/* LEADER */
import LeaderHome from "./pages/leader/LeaderHome.jsx"
import LeaderEvents from "./pages/leader/LeaderEvents.jsx"


import "./index.css"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>

        {/* LOGIN */}
        <Route path="/" element={<LoginPage />} />

        {/* ADMIN */}
        <Route path="/admin" element={<AdminHome />} />
        <Route path="/admin/ministries" element={<AdminMinistries />} />
        <Route path="/admin/leaders" element={<AdminLeaders />} />   {/* FIX */}
        <Route path="/admin/events" element={<AdminEvents />} />
      


        {/* NUEVO: CONFIGURACIÓN DE EVENTOS FIJOS */}
        <Route path="/admin/eventsconfig" element={<AdminEventsConfig />} />
   <Route path="/admin/calendar-rules" element={<AdminCalendarRules />} />   {/* AQUÍ EXACTO */}
<Route path="/admin/auto-calendar" element={<AdminAutoCalendar />} />

        {/* LEADER */}
        <Route path="/leader" element={<LeaderHome />} />
        <Route path="/leader/events" element={<LeaderEvents />} />

        {/* CALENDARIO GENERAL */}
        <Route path="/calendar" element={<CalendarPage />} />

      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
