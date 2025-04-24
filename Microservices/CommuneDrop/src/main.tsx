import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { GoogleMapsProvider } from "./context/GoogleMapsContext";
import { LocationProvider } from "./context/LocationContext";
import { OrderProvider } from "./context/OrderContext";
import { NotificationProvider } from "./components/notifications/NotificationProvider";
import { TrackingProvider } from "./context/TrackingContext";
import "./styles/Globals.css";

//
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <GoogleMapsProvider>
        <LocationProvider>
          <OrderProvider>
            <NotificationProvider>
              <TrackingProvider>
                <Router>
                  <App />
                </Router>
              </TrackingProvider>
            </NotificationProvider>
          </OrderProvider>
        </LocationProvider>
      </GoogleMapsProvider>
    </AuthProvider>
  </React.StrictMode>
);
