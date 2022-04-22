const cartModel = require('../models/cartModel')
const orderModel = require('../models/orderModel')
const userModel = require('../models/userModel')
const validator = require('../validators/validator')



//*************************************************Create Order************************************************************** */
const createOrder = async function (req, res) {
    try {
        const userId = req.params.userId
        const requestBody = req.body

        const { cartId, status, cancellable } = requestBody

        const finalFilter = { }

        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "requestBody is empty" })
        }

        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "enter valid userId" })
        }

        if(!validator.isValidObjectId(cartId)){
            return res.status(400).send({status:false,message:"enter valid cartId"})
        }

        const isUserExists = await userModel.findById(userId)
        if (!isUserExists) {
            return res.status(404).send({ status: false, message: "user data not found" })
        }

        const isCartExists = await cartModel.findById(cartId)
        if(!isCartExists){
            return res.status(404).send({status:false,message:"cart data not found"})
        }

        // authorization
        if (req.userId != userId) {
            return res.status(403).send({ status: false, message: "you are not authorized" })
        }


        if(isCartExists.userId != userId){
            return res.status(400).send({status:false,message:"cart is not belong to user"})
        }

        finalFilter['userId'] = userId

         const {items,totalPrice,totalItems} = isCartExists

         if(items.length ===0 ){
             return res.status(404).send({status:false,message:"no items found in cart "})
         }
      
         finalFilter['items'] = items
         finalFilter['totalPrice'] = totalPrice
         finalFilter['totalItems'] = totalItems

         let totalQuantity = 0
         for(let i =0;i<items.length;i++){
            totalQuantity= totalQuantity + items[i].quantity

         }
         finalFilter['totalQuantity'] = totalQuantity
            

        if ('status' in req.body) {
            if (["pending", "completed", "cancelled"].indexOf(status) == -1) {
                return res.status(400).send({ status: false, message: "status is in valid" })
            }
            finalFilter['status'] = status
        }

        if ('cancellable' in req.body) {
            if (cancellable != 'true' || cancellable != 'false') {
                return res.status(400).send({ status: false, message: "cancellable is in valid" })
            }
        }

        const ordercreation = await orderModel.create(finalFilter)
        return res.status(201).send({ status: true, message: "Success", data: ordercreation })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}


// **********************************************Update Order ****************************************************************************


const updateOrder = async function (req, res) {
    try {

        const userId = req.params.userId
        const requestBody = req.body

        const { orderId, status } = requestBody

        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "requestBody is empty" })
        }

        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "userId is in valid" })
        }

        if (!validator.isValidObjectId(orderId)) {
            return res.status(400).send({ status: false, message: "orderId is in valid" })
        }

    

        const isUserExists = await userModel.findById(userId)
        if (!isUserExists) {
            return res.status(404).send({ status: false, message: "userData not found" })
        }

        // authorization
        if (req.userId != userId) {
            return res.status(403).send({ status: false, message: "you are not authorized" })
        }
       

        const isOrderExists = await orderModel.findById(orderId)
        if (!isOrderExists) {
            return res.status(404).send({ status: false, message: "orderData not found" })
        }

        if (isOrderExists.userId != userId) {
            return res.status(400).send({ status: false, message: "order  not belongs to the user" })
        }

        if ('status' in req.body) {
            if (["pending", "completed", "cancelled"].indexOf(status) == -1) {
                return res.status(400).send({ status: false, message: "status is in valid" })
            }
        } else {
            return res.status(400).send({ status: false, message: "provide status for update" })
        }

        if (isOrderExists.status == "completed") {
            return res.status(400).send({ status: false, message: "order is completed you cant change it " })
        }
        
        if (isOrderExists.cancellable == false && status == "cancelled") {
            return res.status(400).send({ status: false, message: "this order is not cancellable" })
        }

        if (isOrderExists.status == "completed" && status == "cancelled") {
            return res.status(400).send({ status: false, message: "you cant cancelled the order because it already completed " })
        }


        const updatedData = await orderModel.findOneAndUpdate({ _id: orderId }, { status: status }, { new: true })

        return res.status(200).send({ status: true, message: "Success", data: updatedData })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}




module.exports = { createOrder, updateOrder }