"use client"
import { X, Check, DollarSign, AlertCircle, Clock, Package } from "lucide-react"
import { useState } from "react"

const NotificationCenter = ({ notifications, onClose, onMarkAsRead, onClearAll }) => {
  const [filter, setFilter] = useState("all") // all, unread, payment

  // Filter notifications based on selected filter
  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "unread") return !notification.read
    if (filter === "payment") return notification.type === "payment"
    return true // "all" filter
  })

  // Format timestamp to a readable format
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Get appropriate icon for notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case "payment":
        return <DollarSign size={18} className="notification-icon payment" />
      case "delivery_request":
        return <Package size={18} className="notification-icon delivery" />
      default:
        return <AlertCircle size={18} className="notification-icon" />
    }
  }

  // Format notification message based on type and data
  const getNotificationMessage = (notification) => {
    const { type, data } = notification

    switch (type) {
      case "payment":
        return (
          <>
            <strong>Payment Received</strong>
            <p>Order #{data.orderId.substring(0, 8)}... has been paid</p>
            <div className="notification-details">
              <span className="notification-status">{data.status}</span>
              <span className="notification-time">
                <Clock size={14} />
                {formatTime(data.timestamp)}
              </span>
            </div>
          </>
        )
      case "delivery_request":
        return (
          <>
            <strong>New Delivery Request</strong>
            <p>Order #{data.orderId.substring(0, 8)}... needs delivery</p>
            <div className="notification-details">
              <span className="notification-status urgent">Urgent</span>
              <span className="notification-time">
                <Clock size={14} />
                {formatTime(data.timestamp)}
              </span>
            </div>
          </>
        )
      default:
        return <p>New notification received</p>
    }
  }

  return (
    <div className="notification-center">
      <div className="notification-header">
        <h3>Notifications</h3>
        <div className="notification-actions">
          <button className="clear-button" onClick={onClearAll}>
            Clear All
          </button>
          <button className="close-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="notification-filters">
        <button className={`filter-button ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
          All
        </button>
        <button className={`filter-button ${filter === "unread" ? "active" : ""}`} onClick={() => setFilter("unread")}>
          Unread
        </button>
        <button
          className={`filter-button ${filter === "payment" ? "active" : ""}`}
          onClick={() => setFilter("payment")}
        >
          Payments
        </button>
      </div>

      <div className="notifications-list">
        {filteredNotifications.length === 0 ? (
          <div className="no-notifications">
            <p>No notifications to display</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div key={notification.id} className={`notification-item ${notification.read ? "read" : "unread"}`}>
              {getNotificationIcon(notification.type)}
              <div className="notification-content">{getNotificationMessage(notification)}</div>
              {!notification.read && (
                <button className="mark-read-button" onClick={() => onMarkAsRead(notification.id)} title="Mark as read">
                  <Check size={16} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default NotificationCenter

