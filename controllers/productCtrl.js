const Products = require('../models/productModel')

const productCtrl = {

    getProducts: async (req, res) => {
        try {

            // Create a new object called features which includes
            // all products found and a query for which products
            // to showcase. Keep in mind that when making an http
            // request, such as (https://google.com), you can add
            // a query by including a question mark at the end of
            // the link followed by the query's name and value. For ex,
            // https://google.com/?query=title
            const features = new APIfeatures(Products.find(), req.query)
                .filtering().sorting().paginating()

            // Find all products based on the query at hand
            const products = await features.query

            // Return products to client
            return res.json({
                status: 'success',
                result: products.length,
                products
            })

        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    createProduct: async (req, res) => {
        try {

            // Grab request parameters
            const { product_id, title, price, description, content, images, category } = req.body

            // Verify an image was provided
            if (!images) return res.status(400).json({msg: "Please upload an image for your product."})

            // Verify product does not already exist
            const existingProduct = await Products.findOne({product_id})
            if (existingProduct) return res.status(400).json({msg: "This product already exists in your system"})

            // Verify a category is chosen
            if (!category) return res.status(400).json({msg: "Please select a category."})

            // Create and save the new product
            const newProduct = new Products({
                product_id,
                title: title.toLowerCase(),
                price,
                description,
                content,
                images,
                category
            })
            await newProduct.save()

            // Return the new product to the client
            return res.json({msg: "New product created!"})

        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    deleteProduct: async (req, res) => {
        try {

            // Find and delete the product by its ID
            await Products.findByIdAndDelete(req.params.id)

            // Return a successful message to the client
            return res.json({msg: "Product successfully deleted!"})

        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    updateProduct: async (req, res) => {
        try {

            // Grab request parameters
            const { title, price, description, content, images, category } = req.body

            // Verify an image was provided
            if (!images) return res.status(400).json({msg: "Please upload an image for your product."})

            // Find the product based on the request parameters
            // and update it based on the new data submitted
            await Products.findByIdAndUpdate({_id: req.params.id}, {
                title: title.toLowerCase(),
                price,
                description,
                content,
                images,
                category
            })

            // Return a successful message to the client
            return res.json({msg: "Product successfully updated!"})
                
        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    }

}

// Filter, sorting and pagination

// Create a class for the various API feature objects we'll use
// This class has three methods and two parameters that are passed
// to it when creating an object. The object will come with all
// the methods provided
class APIfeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }
    filtering() {

        // Grab the query string from the URL
        const queryObj = {...this.queryString} // queryString = req.query

        // Create an array of the fields that will be removed from
        // the query object
        const excludedFields = ['page', 'sort', 'limit']

        // The delete method removes a specified value from a set object.

        // The below code is to filter out the page, sort, and limit query parameters
        // that would be included in the query object
        excludedFields.forEach(el => delete(queryObj[el]))

        // Convert the query object into a string
        let queryStr = JSON.stringify(queryObj)

        // add regex to the query string to allow the greater than/less than operators
        // to the queries, along with searching key letters/words when querying for
        // the title. You can query a price such as localhost:5000/api/products?price[gte]=100
        // This shoudl show any products with a price greater than or equal to 100. For title,
        // localhost:5000/api/products?title[regex]=m should show any products where the title
        // includes the letter m. Without regex or gte/lte, you would have to filter based
        // on exact values
        queryStr = queryStr.replace(/\b(gte|gt|lt|lte|regex)\b/g, match => '$' + match)

        // From the list of products gathered, find the ones that fit this query
        this.query.find(JSON.parse(queryStr))
        
        return this
    }
    sorting() {

        //If within the query, there's a sort parameter
        if (this.queryString.sort) {

            // Concatenate the strings within the sort array, remove any
            // commas within the array's strings, and join them with
            // a space between each of them
            const sortBy = this.queryString.sort.split(',').join(' ')

            // Set the sort parameter of the object's query to be the
            // newer version without the commas 
            this.query = this.query.sort(sortBy)

        } else {

            // if there isn't a sort method provided, use the default
            // method of sorting by most recently created
            this.query = this.query.sort('-createdAt')

        }

        return this

    }
    paginating() {

        // Grab the query string's page parameter if one is available,
        // otherwise set the default value to one
        const page = this.queryString.page * 1 || 1

        // Grab the query string's limit parameter if one is available,
        // otherwise set the default value to nine
        const limit = this.queryString.limit * 1 || 9

        // Set the skip equal to the page you're on
        const skip = (page - 1) * limit

        // Apply the skip and limit methods to the query based on page
        this.query = this.query.skip(skip).limit(limit)
        return this      

    }
}

module.exports = productCtrl