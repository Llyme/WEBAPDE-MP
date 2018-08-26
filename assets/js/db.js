if (process.env.NODE_ENV === 'production') {
    module.exports = {
        mongoURI: 'mongodb://admin:admin123@ds125352.mlab.com:25352/forthememes'
    }
} else {
    module.exports = {
        mongoURI: 'mongodb://localhost:27017/ForTheMemes'
    }
}
