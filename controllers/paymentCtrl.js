const Payments = require('../models/paymentModel')
const Users = require('../models/userModel')
const Products = require('../models/productModel')

const paymentCtrl = {

    getPayments: async (req, res) => {

        try {

            // Search for all payments and send to client
            const payments = await Payments.find()
            return res.json({payments})

        } catch (err) {
            return res.status(500).json({msg: err.message})
        }

    },
    createPayment: async (req, res) => {

        try {

            // Pull name and email from logged in user
            const user = await Users.findById(req.user.id).select('firstname lastname email')
            if (!user) return res.status(400).json({msg: "Please login or register."})

            // Grab request parameters
            const { cart, paymentId, address } = req.body

            // Grab ID, name, and email from found user
            const { _id, firstname, lastname, email } = user

            // Create a new payment
            const newPayment = new Payments({
                user_id: _id,
                firstname,
                lastname,
                email,
                address,
                cart,
                paymentId
            })

            // For each item in the cart,
            // update the sold property
            cart.filter( item => {
                return sold(item._id, item.quantity, item.sold)
            })

            // Save the new payment to the database
            await newPayment.save()

            return res.json({newPayment})


        } catch (err) {
            return res.status(500).json({msg: err.message})
        }

    }

}

// Updates the "sold" property for each product sold in transaction
const sold = async (id, quantity, oldSold) => {
    await Products.findOneAndUpdate({_id: id}, {
        sold: quantity + oldSold
    })
}

module.exports = paymentCtrl