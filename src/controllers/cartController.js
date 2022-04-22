
const cartModel = require('../models/cartModel')
const productModel = require('../models/productModel')
const userModel = require('../models/userModel')
const validator = require('../validators/validator')


//************************************************Create Cart***************************************************** */
const createCart = async function (req, res) {
    try {

        const userId = req.params.userId
        const requestBody = req.body

        const { cartId, productId, quantity } = requestBody                    //Destructing the requestBody

        // validating the userId ,productId ,quantity
        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "userId is invalid" })
        }
        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "productId is invalid" })
        }
        if (!validator.isValidNumber(quantity)) {
            return res.status(400).send({ status: false, message: "quantity must be number and present" })
        }
        if (quantity < 1) {
            return res.status(400).send({ status: false, message: "quantity must greater than zero" })
        }

        // checking the userId and productId exists or not  in database
        const isUserExists = await userModel.findById(userId)
        if (!isUserExists) {
            return res.status(404).send({ status: false, message: "user data not found" })
        }
        const isProductExists = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!isProductExists) {
            return res.status(404).send({ status: false, message: "product data not found" })
        }

         // authorization
         if (req.userId != userId) {
            return res.status(403).send({ status: false, message: "you are not authorized" })
        }

        // --------------------------------------If cartId exist in requestBody----------------------------------------

        if ('cartId' in req.body) {

            // validating the cartId
            if (!validator.isValidObjectId(cartId)) {
                return res.status(400).send({ status: false, message: "cartId is invalid" })
            }
            // checking the cartId exists or not in database
            const isCartExists = await cartModel.findById(cartId)
            if (!isCartExists) {
                return res.status(404).send({ status: false, message: "cart data not found" })
            }

            if (isCartExists.userId != userId) {
                return res.status({ status: false, message: "this cart is not belongs to this userid " })
            }

            // calculating  the total price   
            //totalPrice = product price(from product database) multiple by total number of quantity(from input)  and add totalPrice(from cart database)
            const totalPrice = isProductExists.price * quantity + isCartExists.totalPrice

            // totalItems =  increase totalItems (from cart database) by 1
            const totalItems = isCartExists.totalItems + 1


            //    if product already exists in items{cart}
            let arrayOfItems = isCartExists.items

            for (let i = 0; i < arrayOfItems.length; i++) {
                if (arrayOfItems[i].productId == productId) {

                    let finalFilter = {
                        totalPrice: totalPrice

                    }

                    finalFilter[`items.${i}.quantity`] = quantity + arrayOfItems[i].quantity

                    const productToDeleteFromCart = await cartModel.findOneAndUpdate({ items: { $elemMatch: { productId: arrayOfItems[i].productId } } }, { $set: finalFilter }, { new: true })
                    return res.status(200).send({ status: true, message: "Success", data: productToDeleteFromCart })
                }
            }

            //when the productId do not exists in cart
            //  storing in a variable what we need to update 
            const cartDataToAddProduct = {
                $push: { items: [{ productId: productId, quantity: quantity }] },      //by using $push we will push the productid and quantity in items Array
                totalPrice: totalPrice,
                totalItems: totalItems,
            }

            // updating the new items and totalPrice and tOtalItems
            const addToCart = await cartModel.findOneAndUpdate({ _id: cartId }, cartDataToAddProduct, { new: true })
            return res.status(200).send({ status: true, message: "Success", data: addToCart })

        }
        // ----------------------------------------------------------------------------------------------------------

        // --------------------------If cartId not exist in requestBody it will create the new cart----------------------------------------


        //     if the user is created the  cart but not give in requestBody
        const isCartAlreadyCreated = await cartModel.findOne({ userId: userId })
        if (isCartAlreadyCreated) {
            return res.status(400).send({ status: false, message: "cart already created please provide cartId" })

        }


        //  storing in a variable what we need to create
        const cartDataToCreate = {
            userId: userId,
            items: [{
                productId: productId,
                quantity: quantity,
            }],
            totalPrice: isProductExists.price * quantity,
            totalItems: 1,
        }

        // creating the new cart with adding the products
        const cartCreation = await cartModel.create(cartDataToCreate)
        return res.status(201).send({ status: true, message: "Success", data: cartCreation })


    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}


//************************************************************Update Cart************************************************************* */


const updateCart = async function (req, res) {


    try {

        const userId = req.params.userId
        const requestBody = req.body

        const { productId, cartId, removeProduct } = requestBody

        // validating the userId ,productId ,removeProduct,cartId

        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "userId is invalid" })
        }

        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "productId is invalid" })
        }
        if (!validator.isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, message: "cartId is invalid" })
        }
        if (!validator.isValidNumber(removeProduct)) {
            if (removeProduct !== 0 && removeProduct !== 1) {
                return res.status(400).send({ status: false, message: "removeProduct  is must present and it should be Number i.e 0 or 1" })
            }
        }else{
            return res.status(400).send({status:false,message:"removeProduct is mandatory"})
        }

        
        // checking the userId , productId and cartId  exists or not  in database
        const isUserExists = await userModel.findById(userId)
        if (!isUserExists) {
            return res.status(404).send({ status: false, message: "user data not found" })
        }
        const isProductExists = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!isProductExists) {
            return res.status(404).send({ status: false, message: "product data not found" })
        }
        const isCartExists = await cartModel.findById(cartId)
        if (!isCartExists) {
            return res.status(404).send({ status: false, message: "cart data not found" })
        }

        // authorization
        if (req.userId != userId) {
            return res.status(403).send({ status: false, message: "you are not authorized" })
        }

        if (isCartExists.userId != userId) {
            return res.status(400).send({ status: false, message: "this cart is not belongs to this userid " })
        }


        
        // ---------------------------------------------------------------------------------------------
        let arrayOfItems = isCartExists.items

        if (arrayOfItems.length == 0) {
            return res.status(400).send({ status: false, message: "items is empty noting to update" })
        }
        for (i = 0; i < arrayOfItems.length; i++) {
        

            if (arrayOfItems[i].productId == productId ) {
                if (removeProduct == 0 || isCartExists.items[i].quantity == 1) {
                    const finalFilterToDelete = {
                        $pull: { items: { productId: productId } },
                        totalPrice: isCartExists.totalPrice - isProductExists.price * isCartExists.items[i].quantity,
                        totalItems: isCartExists.totalItems - 1
                    }

                    const productToDeleteFromCart = await cartModel.findOneAndUpdate({ items: { $elemMatch: { productId: arrayOfItems[i].productId } } }, finalFilterToDelete, { new: true })
                    return res.status(200).send({ status: true, message: "Success", data: productToDeleteFromCart })
                }



                const finalFilterToremoveQuantity = {
                    totalPrice: isCartExists.totalPrice - isProductExists.price,

                }

                finalFilterToremoveQuantity[`items.${i}.quantity`] = isCartExists.items[i].quantity - 1


                const productToRemoveFromCart = await cartModel.findOneAndUpdate({ _id: cartId }, finalFilterToremoveQuantity, { new: true })

                return res.status(200).send({ status: true, message: "Success", data: productToRemoveFromCart })

            }

        }
        return res.status(404).send({ status: false, message: "No products found with productId in cart" })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }

}



//******************************************************Cart Details****************************************************************** */

const getCartDetails = async function (req, res) {
    try {

        const userId = req.params.userId

        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "enter valid userId" })
        }

        const isUserExists = await userModel.findById(userId)
        if (!isUserExists) {
            return res.status(404).send({ status: false, message: "user Data not found" })
        }
        // authorization
        if (req.userId != userId) {
            return res.status(403).send({ status: false, message: "you are not authorized" })
        }

        const isCartExists = await cartModel.findOne({ userId: userId })
        if (!isCartExists) {
            return res.status(404).send({ status: false, message: "cart data not found" })
        } else {
            return res.status(200).send({ status: true, message: "Success", data: isCartExists })
        }


    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }

}
//*********************************************Delete Cart**************************************************************** */

const deleteCart = async function (req, res) {
    try {

        const userId = req.params.userId

        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "enter valid userId" })
        }

        const isUserExists = await userModel.findById(userId)
        if (!isUserExists) {
            return res.status(404).send({ status: false, message: "user Data not found" })
        }

        // authorization
        if (req.userId != userId) {
            return res.status(403).send({ status: false, message: "you are not authorized" })
        }

        const isCartExists = await cartModel.findOne({ userId: userId })
        if (!isCartExists) {
            return res.status(404).send({ status: false, message: "cart data not found" })
        }

        if (isCartExists.items.length == 0) {
            return res.status(400).send({ status: false, message: "items is already empty" })
        }

        const finalFilterForDeleting = {
            items: [],
            totalItems: 0,
            totalPrice: 0
        }

        const cartDeletion = await cartModel.findOneAndUpdate({ _id: isCartExists._id }, finalFilterForDeleting, { new: true })

        return res.status(200).send({ status: true, message: "Success", data: cartDeletion })



    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }

}



module.exports = { createCart, updateCart, getCartDetails, deleteCart }


