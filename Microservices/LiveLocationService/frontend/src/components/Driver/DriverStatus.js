"use client"
import { Wifi } from "lucide-react"

const DriverStatus = ({ status, toggleStatus }) => {
  return (
    <div className="driver-status-card">
      <div className="status-icon">
        <Wifi size={20} color={status === "online" ? "#34A853" : "#999"} />
      </div>
      <div className="status-text">Driver Status</div>
      <div className={`status-indicator ${status}`}>{status === "online" ? "Online" : "Offline"}</div>
      <label className="toggle-switch">
        <input type="checkbox" checked={status === "online"} onChange={toggleStatus} />
        <span className="toggle-slider"></span>
      </label>
    </div>
  )
}

export default DriverStatus

