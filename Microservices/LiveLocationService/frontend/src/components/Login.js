"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "../styles/Login.css"
import { Package } from "lucide-react"

const Login = () => {
  const [userType, setUserType] = useState("")
  const navigate = useNavigate()

  const handleLogin = (type) => {
    setUserType(type)
    navigate(`/${type.toLowerCase()}`)
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-icon">
          <Package size={48} color="#4a90e2" />
        </div>
        <h1>Package Delivery Tracker</h1>
        <p className="login-subtitle">Track your packages in real-time from pickup to delivery</p>

        <div className="login-option-card">
          <div className="login-option-icon">
            <Package size={32} color="#4a90e2" />
          </div>
          <p className="login-option-text">Login as a driver to manage pickups and deliveries</p>
        </div>

        <div className="button-group">
          <button className="login-button driver-button" onClick={() => handleLogin("driver")}>
            Login as Driver
          </button>
          <button className="login-button customer-button" onClick={() => handleLogin("customer")}>
            Login as Customer
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login

