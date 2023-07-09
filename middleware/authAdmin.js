const Users = require('../models/userModel')

const authAdmin = async (req, res, next) => {
    try {

        //Get user information by idfind
        const user = await Users.findById({_id: req.user.id})

        // Verify user is an admin
        if (user.role === 0) return res.status(400).json({msg: "Admin resources access denied"})

        // Finish middleware
        next()

    } catch (err) {
        return res.status(500).json({msg: err.message})
    }
}

module.exports = authAdmin