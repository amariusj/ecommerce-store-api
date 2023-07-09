// require user model to make changes to user collection
const Users = require('../models/userModel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Payments = require('../models/paymentModel')

const userCtrl = {

    register: async (req, res) => {
        try {

            // Grab all request body parameters
            const { firstname, lastname, email, password, confirmPassword } = req.body

            // Verify a user does not already exist with that email address
            const user = await Users.findOne({email})
            if (user) return res.status(400).json({msg: "A user already exists with that email address."})

            // Verify password length
            if (password.length < 8) return res.status(400).json({msg: "Password must be at least 8 characters."})

            // Verify password matches
            if (password != confirmPassword) return res.status(400).json({msg: "Passwords do not match."})

            // Hash password using bcrypt
            const hashedPassword = await bcrypt.hash(password, 10)

            // Create and save new user
            const newUser = await new Users({
                firstname,
                lastname,
                password: hashedPassword,
                email
            }).save()

            // Next, create the access token using jsonwebtoken
            const accessToken = createAccessToken({id: newUser._id})

            // Then, create the refresh token
            const refreshToken = createRefreshToken({id: newUser._id})

            // Create a cookie for the refresh token
            res.cookie('refreshtoken', refreshToken, {
                httpOnly: true,
                path: '/user/refresh_token',
                maxAge: 7*24*60*60*1000 // 7d
            })

            return res.json({msg: "User successfully created!", accessToken})

        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    refreshToken: async (req, res) => {
        try {

            // Grab the refresh token from the request cookies
            const rf_token = req.cookies.refreshtoken

            // Verify they have a refresh token. If not, ask they login or register
            if (!rf_token) return res.status(400).json({msg: "Please Login or Register."})

            // Verify the JSON Web Token is using the refresh token secret
            jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
                if (err) return res.status(400).json({msg: "Please Login or Register"})

                // Create a new access token if their refresh token is verified
                // The verification from jwt should output a "decoded" object, which
                // is where I am able to grab the user ID. The user variable is
                // the "decoded" variable provided by jwt verify. You might also be able
                // to grab this by writing:

                // const user = jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET)
                const accessToken = createAccessToken({id: user.id})

                // Return the refresh token
                return res.json({accessToken, user})
            })

        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    login: async (req, res) => {
        try {

            // Grab reuqest parameters
            const { email, password } = req.body

            // Find a user with that email address
            const user = await Users.findOne({email})

            // If user does not exist, send an error
            if (!user) return res.status(400).json({msg: "A user with that email address does not exist."})

            // Compare the password submitted to the actual user's password in db
            const passwordsMatch = await bcrypt.compare(password, user.password)

            // If passwords do not match, send error
            if (!passwordsMatch) return res.status(400).json({msg: "Incorrect password."})

            // Create the access and refresh tokens and pass the access token to the client
            const accessToken = createAccessToken({id: user._id})
            const refreshToken = createRefreshToken({id: user._id})

            res.cookie('refreshtoken', refreshToken, {
                httpOnly: true,
                path: '/user/refresh_token',
                maxAge: 7*24*60*60*1000 // 7d
            })

            return res.status(200).json({accessToken})

        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    logout: async (req, res) => {
        try {

            // Clear the refresh cookie
            res.clearCookie('refreshtoken', {path: '/user/refresh_token'})

            // Return a successfully logged out message to client
            return res.json({msg: "Successfully logged out"})

        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    getUser: async (req, res) => {
        try {

            // Find the user with the request
            const user = await Users.findById(req.user.id).select('-password')

            // If user does not exist, send error
            if (!user) return res.status(400).json({msg: "User does not exist."})

            // Return user
            return res.json(user)

        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    addCart: async (req, res) => {
        try {

            // Find user
            const user = await Users.findById(req.user.id)

            // If user does not exist, send error
            if (!user) return res.status(400).json({msg: "User does not exist"})

            // Update user's cart
            await Users.findOneAndUpdate({_id: req.user.id}, {
                cart: req.body.cart
            })

            return res.json({msg: "Added to cart"})

        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    history: async (req, res) => {
        try {

            // Grab all payments from a specific user
            const history = await Payments.find({user_id: req.user.id})

            // Send payment history to client
            return res.json(history)

        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    }

}

// Uses Json Web Token library to sign an access token with the user's
// specific user ID. 
const createAccessToken = (user) => {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '11m'})
}

// Same thing for Refresh Token
const createRefreshToken = (user) => {
    return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '7d'})
}

module.exports = userCtrl