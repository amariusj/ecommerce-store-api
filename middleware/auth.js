const jwt = require('jsonwebtoken')

const auth = async (req, res, next) => {
    try {

        // Grab the token from the request
        token = req.header("Authorization")

        // If no token exists, return an invalid authentication error
        if (!token) return res.status(400).json({msg: "Invalid Authentication"})

        // Verify the token is valid with the user making the request
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if (err) return res.status(400).json({msg: "Invalid Authentication"})

            // Grab the ID from the verified token's details, and set it 
            // to the request object as a user
            req.user = user
            next()
        })

    } catch (err) {
        return res.status(500).json({msg: err.message})
    }
}

module.exports = auth