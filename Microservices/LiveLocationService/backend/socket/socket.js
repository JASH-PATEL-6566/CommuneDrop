// backend/socket/socket.js

export const handleSocketConnections = (io) => {
  // This function should handle socket connections
  // and return the broadcastToDrivers function

  const activeDrivers = new Map()

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id)

    socket.on("driverConnected", (data) => {
      console.log("Driver connected:", data.driverId, "with socket ID:", socket.id)
      activeDrivers.set(data.driverId, socket.id)
    })

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id)

      // Remove from active connections
      for (const [driverId, socketId] of activeDrivers.entries()) {
        if (socketId === socket.id) {
          activeDrivers.delete(driverId)
          break
        }
      }
    })
  })

  const broadcastToDrivers = (notification) => {
    console.log(`Broadcasting notification to ${activeDrivers.size} active drivers:`, notification)

    // Send to all active drivers
    for (const [driverId, socketId] of activeDrivers.entries()) {
      const socket = io.sockets.sockets.get(socketId)
      if (socket) {
        socket.emit("driverNotification", notification)
        console.log(`Sent notification to driver ${driverId}`)
      }
    }
  }

  return { broadcastToDrivers }
}

