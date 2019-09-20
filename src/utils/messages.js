const generateMessage = (text, username) => ({
    username,
    text,
    createdAt: new Date().getTime()
})

const generateLocationUrl = (coordinates, username) => ({
    username,
    url: `https://google.com/maps?q=${coordinates.lat},${coordinates.lng}`,
    createdAt: new Date().getTime()
})

module.exports = {
    generateMessage,
    generateLocationUrl
}