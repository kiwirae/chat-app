const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')

const { generateMessage, generateLocationUrl } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const port = process.env.PORT || 3000


const app = express()
const server = http.createServer(app)
const io = socketio(server)

const publicDirectoryPath = path.join(__dirname, '../public')

io.on('connection', (socket) => {
    console.log('New web socket connection')

    socket.on('join', ({ username, room }, cb) => {
        const { error, user } = addUser({ id: socket.id, username, room })

        if (error) {
            return cb(error)
        }

        socket.join(user.room)
        socket.emit('welcomeMessage', generateMessage(`Welcome ${user.username}!`, 'Admin'))
        socket.broadcast.to(room).emit('message', generateMessage(`${user.username} has joined!`, 'Admin'))

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        cb()
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)

        if (!user) {
            return callback("Please reconnect to fix this issue.")
        }

        const filter = new Filter()

        // filter.addWords('bad')

        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed!')
        }

        io.to(user.room).emit('message', generateMessage(message, user.username))
        callback()
    })

    socket.on('sendLocation', (coordinates, cb) => {
        const user = getUser(socket.id)

        if (!user) {
            return cb("Please reconnect to fix this issue.")
        }

        io.to(user.room).emit('locationMessage', generateLocationUrl(coordinates, user.username))
        cb('Location has been shared!')
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage(`${user.username} has left ${user.room}`, 'Admin'))

            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

app.use(express.static(publicDirectoryPath))

app.get('', (req, res) => {
    res.send('index')
})

server.listen(port, () => console.log(`Server is up on port: ${port}`))