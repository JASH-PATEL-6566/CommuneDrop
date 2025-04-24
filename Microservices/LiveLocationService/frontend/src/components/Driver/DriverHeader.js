"use client"
import { Bell } from "lucide-react"

const DriverHeader = ({ title, tripStatus, unreadNotifications = 0, toggleNotifications }) => {
  return (
    <header className="driver-header">
      <h1>{title}</h1>
      <div className="header-actions">
        {/* Notification bell with badge */}
        <button className="notification-button" onClick={toggleNotifications}>
          <Bell size={20} />
          {unreadNotifications > 0 && <span className="notification-badge">{unreadNotifications}</span>}
        </button>

        {tripStatus !== "waiting" && (
          <div className={`status-badge ${tripStatus}`}>{tripStatus.charAt(0).toUpperCase() + tripStatus.slice(1)}</div>
        )}

        {tripStatus === "waiting" && <div className="status-badge waiting">Waiting</div>}
      </div>
    </header>
  )
}

export default DriverHeader

