const Category = require('../models/categoryModel')

const categoryCtrl = {

    getCategories: async (req, res) => {
        try {

            // Grab all categories from the database
            const categories = await Category.find()

            // Return all categories
            return res.json(categories)

        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    createCategory: async (req, res) => {
        try {

            // Grab the name from the request body
            const { name } = req.body

            // Verify category does not already exists
            const category = await Category.findOne({name})
            if (category) return res.status(400).json({msg: "That category already exists."})

            // Create a new category
            const newCategory = new Category({name})

            // Save the category
            await newCategory.save()

            // Return a successful message
            return res.json({msg: "New Category created!"})

        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    deleteCategory: async (req, res) => {
        try {

            // Find a category and delete it based on the
            // request parameters id
            await Category.findByIdAndDelete(req.params.id)

            // Send successful message
            return res.json({msg: "Category deleted!"})

        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    updateCategory: async (req, res) => {
        try {

            // Grab new name from request
            const { name } = req.body

            // Find and update the category's name
            await Category.findOneAndUpdate(
                {_id: req.params.id},
                {name}
            )

            // Return a successful message
            return res.status(200).json({msg: "Category updated!"})

        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    }

}

module.exports = categoryCtrl