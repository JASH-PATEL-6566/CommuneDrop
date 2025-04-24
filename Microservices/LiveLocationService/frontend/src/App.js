import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import DriverApp from "./components/Driver/DriverApp"
import CustomerApp from "./components/Customer/CustomerApp"
import Login from "./components/Login"
import "./App.css"

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/driver" element={<DriverApp />} />
          <Route path="/customer" element={<CustomerApp />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App

