import { Server } from 'socket.io'
import { createServer } from 'http'

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

const PORT = 3001

// Store active broadcast progress
const broadcastProgress = new Map<string, any>()

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  // Join broadcast room
  socket.on('join-broadcast', (broadcastId: string) => {
    socket.join(`broadcast:${broadcastId}`)
    console.log(`Client ${socket.id} joined broadcast:${broadcastId}`)

    // Send current progress if exists
    if (broadcastProgress.has(broadcastId)) {
      socket.emit('broadcast-progress', broadcastProgress.get(broadcastId))
    }
  })

  // Leave broadcast room
  socket.on('leave-broadcast', (broadcastId: string) => {
    socket.leave(`broadcast:${broadcastId}`)
    console.log(`Client ${socket.id} left broadcast:${broadcastId}`)
  })

  // Update broadcast progress (for demo purposes)
  socket.on('update-progress', (data: { broadcastId: string; progress: any }) => {
    broadcastProgress.set(data.broadcastId, data.progress)
    io.to(`broadcast:${data.broadcastId}`).emit('broadcast-progress', data.progress)
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

httpServer.listen(PORT, () => {
  console.log(`Broadcast WebSocket service running on port ${PORT}`)
})
