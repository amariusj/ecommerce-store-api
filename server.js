/* This file is the Server file for my ecommerce website. This file
runs all JavaScript code that will house back-end functionality
for this Website. This file starts the server, runs any configurations
necessary for the server, connects to the external database (MongoDB),
and even more.*/

//Require all dependencies here:

require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const morgan = require('morgan')
const cors = require('cors')
const fileUpload = require('express-fileupload')
const cookieParser = require('cookie-parser')
const path = require('path')

// Call express
const app = express()

// Call the parsers that'll be used with express
app.use(express.json())
app.use(cookieParser())
app.use(cors())
app.use(morgan('dev'))
app.use(fileUpload({
    useTempFiles: true
}))

// Connect to MongoDB
const URI = process.env.MONGODB_URI
mongoose.connect(URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).catch(err => console.log(err))

// A default home request with a welcome message
app.get('/', (req, res) => {
    res.json({msg: "Welcome"})
})

// Add all routes
app.use('/user', require('./routes/userRouter'))
app.use('/api', require('./routes/categoryRouter'))
app.use('/api', require('./routes/upload'))
app.use('/api', require('./routes/productRouter'))
app.use('/api', require('./routes/paymentRouter'))

// Run the server on the following port
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
    console.log('Server is running on port', PORT)
})