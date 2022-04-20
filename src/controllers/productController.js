const productModel = require('../models/productModel')
const validator = require('../validators/validator')
const awsFile = require('../aws/aws')




//*******************************************************Create Product API ********************************************************************* */
const createProduct = async function (req, res) {

    try {
        const requestBody = req.body
        const { title, description, price, currencyId, currencyFormat,                                  //Destructuring the requestBody
            isFreeShipping, style, availableSizes, installments, isDeleted } = requestBody

        //validating the requestBody
        if (!validator.isValidString(title)) {
            return res.status(400).send({ status: false, message: "please enter title" })
        }

        if (!validator.isValidString(description)) {
            return res.status(400).send({ status: false, message: "please enter description" })
        }

        if (!validator.isValidNumber(price)) {
            return res.status(400).send({ status: false, message: "please enter price and it must be number" })
        }

        if (installments) {
            if (!validator.isValidNumber(installments)) {
                return res.status(400).send({ status: false, message: " installment   must be number" })
            }
        }
        if (validator.isValidString(isDeleted)) {
            if (isDeleted !== 'true' && isDeleted !== 'false') {
                return res.status(400).send({ status: false, message: "isdeleted  must be in boolean" })
            }
        }

        if (validator.isValidString(isFreeShipping)) {
            if (isFreeShipping !== 'true' && isFreeShipping != 'false') {
                return res.status(400).send({ status: false, message: "isFreeShipping  must be in boolean" })
            }
        }

        if (validator.isValidString(currencyId)) {
            if (currencyId != "INR") {
                return res.status(400).send({ status: false, message: "please provide valid currencyId i.e INR " })
            }
        } else {
            return res.status(400).send({ status: false, message: "please enter currencyId" })
        }

        if (validator.isValidString(currencyFormat)) {
            if (currencyFormat != "₹") {
                return res.status(400).send({ status: false, message: "please provide valid  currencyFormat i.e ₹ " })
            }
        } else {
            return res.status(400).send({ status: false, message: "please enter currencyFormat" })
        }

        if (style) {
            if (typeof style !== 'string') {
                return res.status(400).send({ status: false, message: "style must be in string" })
            }
        }


        if (!validator.isValidString(availableSizes)) {
            return res.status(400).send({ status: false, message: "please enter availableSizes " })
        }
        //validation ends 

        //checking the user exists or not
        const isTitleAlreadyExists = await productModel.findOne({ title: title })
        if (isTitleAlreadyExists) {
            return res.status(400).send({ status: false, message: "title already used" })
        }

        // checking the available size is correct or not
        console.log(availableSizes)
        let availableSizesInArray = availableSizes.map(x => x.trim())

        for (let i = 0; i < availableSizesInArray.length; i++) {
            if (["S", "XS", "M", "X", "L", "XXL", "XL"].indexOf(availableSizesInArray[i]) == -1) {
                return res.status(400).send({ status: false, message: "AvailableSizes contains ['S','XS','M','X','L','XXL','XL'] only" })
            } else {
                requestBody["availableSizes"] = availableSizesInArray
            }

            //creating the AWS link
            let files = req.files
            if (files && files.length > 0) {
                requestBody["productImage"] = await awsFile.uploadFile(files[0])
            } else {
                return res.status(400).send({ status: false, message: "please provide profile pic " })

            }
            const productData = await productModel.create(requestBody)
            return res.status(201).send({ status: true, message: "product created successfully", data: productData })
        }

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}


// ---------------------------------------------------------------------------------------------------------------------------------

const productsDetails = async function (req, res) {

    try {

        const requestQuery = req.query

        const { size, name, priceGreaterThan, priceLessThan ,priceSort} = requestQuery                  // distructing the requestQuery

        const finalFilter = [{ isDeleted: false }]

        // checking the requestQuery input valid or not
        if (validator.isValidString(name)) {
            finalFilter.push({ title: { $regex: name, $options: 'i' } })
        }
        if (validator.isValidString(size)) {
            if (["S", "XS", "M", "X", "L", "XXL", "XL"].indexOf(size) == -1) {
                return res.status(400).send({ status: false, message: "please enter valid size  " })
            }
            finalFilter.push({ availableSizes: size })
        }

        if(Array.isArray(priceSort)){
            return res.status(400).send({status:false,message:"only give one priceSort value i.e 1 or-1"})
        }

        if (validator.isValidNumber(priceGreaterThan)) {

            finalFilter.push({ price: { $gt: priceGreaterThan } })
        }
        if (validator.isValidNumber(priceLessThan)) {

            finalFilter.push({ price: { $lt: priceLessThan } })
        }

        // if there is priceSort to sort the doc 
        if (priceSort) {
            if (validator.isValidNumber(priceSort)) {

                if (priceSort != 1 && priceSort != -1) {
                    return res.status(400).send({ status: false, message: "pricesort must to 1 or -1" })
                }
                const fillteredProductsWithPriceSort = await productModel.find({ $and: finalFilter }).sort({ price: priceSort })

                if (Array.isArray(fillteredProductsWithPriceSort) && fillteredProductsWithPriceSort.length === 0) {
                    return res.status(404).send({ status: false, message: "data not found" })
                }

                return res.status(200).send({ status: true, message: "products with sorted price", data: fillteredProductsWithPriceSort })
            }
        } 

        //   if there is not priceSort 
        const fillteredProducts = await productModel.find({ $and: finalFilter })

        if (Array.isArray(fillteredProducts) && fillteredProducts.length === 0) {
            return res.status(404).send({ status: false, message: "data not found" })
        }

        return res.status(200).send({ status: true, message: "products without sorted price", data: fillteredProducts })


    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }

}



const getProductsById = async function (req, res) {

    try {

        const productId = req.params.productId

        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "productId is invalid " })
        }

        const productData = await productModel.findOne({ _id: productId, isDeleted: false })

        if (!productData) {
            return res.status(404).send({ status: false, message: "no data found" })
        }

        return res.status(200).send({ status: true, message: "product By Id ", data: productData })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}


const updateProduct = async function (req, res) {
    try {

        const requestBody = req.body
        const productId = req.params.productId

        const { title, description, price, currencyId, currencyFormat,
            isFreeShipping, style, availableSizes, installments } = requestBody                 // distructing the requestBody

        const finalFilter = {}


        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "At least one input is required to update" })
        }

        if (!validator.isValidObjectId(productId)) {
            console.log(validator.isValidObjectId(productId))
            return res.status(400).send({ status: false, message: "please provide valid productId" })
        }


        if (validator.isValidString(title)) {
            const isTitleAlreadyExists = await productModel.findOne({ title: title })

            if (isTitleAlreadyExists) {
                return res.status(400).send({ status: false, message: "title already used" })
            }
            finalFilter["title"] = title
            // return res.status(400).send({ status: false, message: "please enter title" })
        }



        if (validator.isValidString(description)) {
            finalFilter["description"] = description
        }


        if (price) {
            if (!validator.isValidNumber(price)) {
                return res.status(400).send({ status: false, message: "please enter price and it must be number" })
            }
            finalFilter["price"] = price
        }

        if (validator.isValidNumber(installments)) {
            // return res.status(400).send({ status: false, message: " installment   must be number" })
            finalFilter["installments"] = installments
        }

        if (validator.isValidString(isFreeShipping)) {

            if (isFreeShipping !== 'true' && isFreeShipping != 'false') {
                return res.status(400).send({ status: false, message: "isFreeShipping  must be in boolean to update " })
            }
            finalFilter["isFreeShipping"] = isFreeShipping
        }

        if (validator.isValidString(currencyFormat)) {
            if (currencyFormat != "₹") {
                return res.status(400).send({ status: false, message: "please provide valid  currencyFormat i.e ₹ " })
            }
            finalFilter["currencyFormat"] = currencyFormat
        }
        if (validator.isValidString(currencyId)) {
            if (currencyId != "INR") {
                return res.status(400).send({ status: false, message: "please provide valid currencyId i.e INR " })
            }
            finalFilter["currencyId"] = currencyId
        }
        if (style) {
            if (typeof style !== 'string') {
                return res.status(400).send({ status: false, message: "style must be in string" })
            }
            finalFilter["style"] = style
        }




        // availableSize is in requstBody then
        if (availableSizes) {
             // checking the length it should not be zero
            if (availableSizes.length == 0) {
                return res.status(400).send({ status: false, message: "availableSizes should not be empty" })
            }

            //  checking availableSize must be array or not
            if (Array.isArray(availableSizes)) {

                // romoving the space if present in array
                let availableSizesInArray = availableSizes.map(x => x.trim())
                //itearting to access every element to check it is valid or not
                for (let i = 0; i < availableSizesInArray.length; i++) {

                    if (["S", "XS", "M", "X", "L", "XXL", "XL"].indexOf(availableSizesInArray[i]) == -1) {
                        return res.status(400).send({ status: false, message: "AvailableSizes contains ['S','XS','M','X','L','XXL','XL'] only" })
                    } else {
                        finalFilter["availableSizes"] = availableSizesInArray
                    }
                }
            } else {
                return res.status(400).send({ status: false, message: "avaliableSize should be in array " })
            }
        }

        let files = req.files
        if (files && files.length > 0) {
            finalFilter["productImage"] = await awsFile.uploadFile(files[0])
        }

        const updatedProductDetails = await productModel.findOneAndUpdate({ _id: productId }, { $set: finalFilter }, { new: true })
        if (!updatedProductDetails) {
            return res.status(404).send({ status: false, message: "data not found" })
        }

        return res.status(200).send({ status: false, message: "product updated successfully ", data: updatedProductDetails })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }

}




const deleteProductByProductId = async function (req, res) {
    try {

        const productId = req.params.productId

        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "productId is invalid" })
        }

        const deletedproduct = await productModel.findOneAndUpdate({ _id: productId, isDeleted: false }, { $set: { isDeleted: true, deletedAt: Date.now() } }, { new: true })

        if (!deletedproduct) {
            return res.status(404).send({ status: false, message: "data not found" })
        }

        return res.status(200).send({ status: true, message: "product is deleted", data: deletedproduct })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }

}






module.exports = { createProduct, productsDetails, updateProduct, getProductsById, deleteProductByProductId }





