// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom"

import LoginPage from "./pages/LoginPage.jsx"
import CalendarPage from "./pages/CalendarPage.jsx"

import AdminHome from "./pages/admin/AdminHome.jsx"
import AdminMinistries from "./pages/admin/AdminMinistries.jsx"
import AdminLeaders from "./pages/admin/AdminLeaders.jsx"
import AdminEvents from "./pages/admin/AdminEvents.jsx"
import AdminEventsConfig from "./pages/admin/AdminEventsConfig.jsx"

import LeaderHome from "./pages/leader/LeaderHome.jsx"
import LeaderEvents from "./pages/leader/LeaderEvents.jsx"

export default function App() {
  console.log("📌 App.jsx cargado")

  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route path="/" element={<LoginPage />} />

        {/* ADMIN */}
        <Route path="/admin" element={<AdminHome />} />
        <Route path="/admin/ministries" element={<AdminMinistries />} />
        <Route path="/admin/leaders" element={<AdminLeaders />} />
        <Route path="/admin/events" element={<AdminEvents />} />
         <Route path="/admin/eventsconfig" element={<AdminEventsConfig />} />

        {/* LÍDER */}
        <Route path="/leader" element={<LeaderHome />} />
        <Route path="/leader/events" element={<LeaderEvents />} />

        {/* CALENDARIO GENERAL */}
        <Route path="/calendar" element={<CalendarPage />} />
      </Routes>
    </BrowserRouter>
  )
}
