const productModel = require('../models/productModel')
const validator = require('../validators/validator')
const awsFile = require('../aws/aws')
const getSymbolFromCurrency = require('currency-symbol-map')




//*******************************************************Create Product API ********************************************************************* */
const createProduct = async function (req, res) {

    try {
        const requestBody = req.body
        let { title, description, price, currencyId,                                  //Destructuring the requestBody
            isFreeShipping, style, availableSizes, installments, isDeleted } = requestBody

        //validating the requestBody
        if (!validator.isValidtitle(title)) {
            return res.status(400).send({ status: false, message: "please enter title" })
        }

        if (!validator.isValid(description)) {
            return res.status(400).send({ status: false, message: "please enter description" })
        }

        if (!validator.isValidNumber(price)) {
            return res.status(400).send({ status: false, message: "please enter price and it must be number" })
        }

        if ('installments' in req.body) {
            if (!/^[0-9]$/.test(installments)) {
                return res.status(400).send({ status: false, message: " installment   must be number" })
            }

        }

        if ('isDeleted' in req.body) {
            if (isDeleted !== 'true' && isDeleted !== 'false') {
                return res.status(400).send({ status: false, message: "isDeleted  must be in boolean" })
            }
        }

        if ('isFreeShipping' in req.body) {
            if (isFreeShipping !== 'true' && isFreeShipping != 'false') {
                return res.status(400).send({ status: false, message: "isFreeShipping  must be in boolean" })
            }
        }

        if ('currencyId' in req.body) {
            if (currencyId != "INR") {
                return res.status(400).send({ status: false, message: "please provide valid currencyId i.e INR " })
            }

            requestBody['currencyFormat'] = getSymbolFromCurrency(currencyId)
        } else {
            return res.status(400).send({ status: false, message: "currencyId is required" })
        }

        if ('style' in req.body) {
            if (typeof style !== 'string') {
                return res.status(400).send({ status: false, message: "style must be in string" })
            }
        }


        if (!('availableSizes' in req.body)) {
            return res.status(400).send({ status: false, message: "please enter availableSizes " })
        }
        //validation ends 

        //checking the title exists or not
        const isTitleAlreadyExists = await productModel.findOne({ title: title })
        if (isTitleAlreadyExists) {
            return res.status(400).send({ status: false, message: "title already used" })
        }

        // checking the available size is correct or not

        // availableSizes = JSON.parse(availableSizes);

        let availableSizesInArray = availableSizes.split(",").map(x => x.trim())

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
            return res.status(201).send({ status: true, message: "Success", data: productData })
        }

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

//**********************************************************Product Details*************************************************************** */

const productsDetails = async function (req, res) {

    try {

        const requestQuery = req.query

        const { size, name, priceGreaterThan, priceLessThan, priceSort } = requestQuery                  // distructing the requestQuery

        const finalFilter = [{ isDeleted: false }]

        // checking the requestQuery input valid or not
        if ('name' in req.query) {
            if (!validator.isValidtitle(name)) {
                return res.status(400).send({ status: false, message: "provide the valid name for filter" })
            }

            finalFilter.push({ title: { $regex: name, $options: 'i' } })
        }
        if ('size' in req.query) {
            if (["S", "XS", "M", "X", "L", "XXL", "XL"].indexOf(size) == -1) {
                return res.status(400).send({ status: false, message: "please enter valid size  " })
            }
            finalFilter.push({ availableSizes: size })
        }

        if (Array.isArray(priceSort)) {
            return res.status(400).send({ status: false, message: "only give one priceSort value i.e 1 or-1" })
        }

        if ('priceGreaterThan' in req.query) {
            if (validator.isValidNumber(priceGreaterThan)) {

                finalFilter.push({ price: { $gt: priceGreaterThan } })
            } else {
                return res.status(400).send({ status: false, message: "provide the valid priceGreaterThan for filter" })
            }
        }

        if ('priceLessThan' in req.query) {
            if (validator.isValidNumber(priceLessThan)) {

                finalFilter.push({ price: { $lt: priceLessThan } })
            }
            else {
                return res.status(400).send({ status: false, message: "provide the valid priceLessThan for filter" })
            }
        }

        // if there is priceSort to sort the doc 
        if ('priceSort' in req.query) {
            if (validator.isValidNumber(priceSort)) {

                if (priceSort != 1 && priceSort != -1) {
                    return res.status(400).send({ status: false, message: "pricesort must to 1 or -1" })
                }
                const fillteredProductsWithPriceSort = await productModel.find({ $and: finalFilter }).sort({ price: priceSort })

                if (Array.isArray(fillteredProductsWithPriceSort) && fillteredProductsWithPriceSort.length === 0) {
                    return res.status(404).send({ status: false, message: "data not found" })
                }

                return res.status(200).send({ status: true, message: "Success", data: fillteredProductsWithPriceSort })
            } else {
                return res.status(400).send({ status: false, message: "priceSort must be number" })
            }
        }

        //   if there is not priceSort 
        const fillteredProducts = await productModel.find({ $and: finalFilter })

        if (Array.isArray(fillteredProducts) && fillteredProducts.length === 0) {
            return res.status(404).send({ status: false, message: "data not found" })
        }

        return res.status(200).send({ status: true, message: "Success", data: fillteredProducts })


    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }

}

// *******************************************************product Details By Id******************************************************//
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

        return res.status(200).send({ status: true, message: "Success", data: productData })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}


//**********************************************Update Product***************************************************************** */


const updateProduct = async function (req, res) {
    try {

        const requestBody = req.body
        const productId = req.params.productId

        const { title, description, price, isFreeShipping,
            style, availableSizes, installments } = requestBody                 // distructing the requestBody

        const finalFilter = {}


        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "At least one input is required to update" })
        }

        if (!validator.isValidObjectId(productId)) {
            console.log(validator.isValidObjectId(productId))
            return res.status(400).send({ status: false, message: "please provide valid productId" })
        }

        if ('title' in req.body) {
            if (validator.isValidtitle(title)) {
                const isTitleAlreadyExists = await productModel.findOne({ title: title, _id: { $ne: productId } })

                if (isTitleAlreadyExists) {
                    return res.status(400).send({ status: false, message: "title already used" })
                }
                finalFilter["title"] = title

            } else {
                return res.status(400).send({ status: false, message: "title should be valid to update" })
            }
        }

        if ('description' in req.body) {
            if (!validator.isValid(description)) {
                return res.status(400).send({ status: false, message: "please enter price and it must be number" })
            }
            finalFilter["description"] = description
        }

        if ('price' in req.body) {
            if (!validator.isValidNumber(price)) {
                return res.status(400).send({ status: false, message: "please enter price and it must be number" })
            }
            finalFilter["price"] = price
        }


        if ('installments' in req.body) {
            if (!/^[0-9]$/.test(installments)) {
                return res.status(400).send({ status: false, message: " installment   must be number" })
            }
            finalFilter["installments"] = installments
        }

        if ('isFreeShipping' in req.body) {
            if (isFreeShipping !== 'true' && isFreeShipping != 'false') {
                return res.status(400).send({ status: false, message: "isFreeShipping  must be in boolean to update " })
            }
            finalFilter["isFreeShipping"] = isFreeShipping
        }

        if ('style' in req.body) {
            if (typeof style !== 'string') {
                return res.status(400).send({ status: false, message: "style must be in string" })
            }
            finalFilter["style"] = style
        }


        // availableSize is in requstBody then

        if ('availableSizes' in req.body) {

            // converting the string into array
            let availableSizesInArray = availableSizes.split(",").map(x => x.trim())
            //itearting to access every element to check it is valid or not
            for (let i = 0; i < availableSizesInArray.length; i++) {

                if (["S", "XS", "M", "X", "L", "XXL", "XL"].indexOf(availableSizesInArray[i]) == -1) {
                    return res.status(400).send({ status: false, message: "AvailableSizes contains ['S','XS','M','X','L','XXL','XL'] only" })
                } else {
                    finalFilter["availableSizes"] = availableSizesInArray
                }
            }
        }



        let files = req.files
        if (files && files.length > 0) {
            finalFilter["productImage"] = await awsFile.uploadFile(files[0])
        }

        const updatedProductDetails = await productModel.findOneAndUpdate({ _id: productId }, { $set: finalFilter }, { new: true })
        return res.status(200).send({ status: true, message: "Success", data: updatedProductDetails })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }

}



//*********************************************************Deleted Product************************************************ */
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

        return res.status(200).send({ status: true, message: "Success", data: deletedproduct })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }

}



module.exports = { createProduct, productsDetails, updateProduct, getProductsById, deleteProductByProductId }





