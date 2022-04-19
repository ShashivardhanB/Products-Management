const orderModel = require('../models/orderModel')
const userModel = require('../models/userModel')
const validator = require('../validators/validator')


const createOrder = async function (req, res) {
    try {
        const userId = req.params.userId
        const requestBody = req.body

        const { items, totalPrice, totalItems, status, cancellable } = requestBody

        // authorization
        if (req.userId != userId) {
            return res.status(403).send({ status: false, message: "you are not authorized" })
        }

        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "enter valid userId" })
        }

        const isUserExists = await userModel.findById(userId)
        if (!isUserExists) {
            return res.status(404).send({ status: false, message: "user data not found" })
        }

        requestBody['userId'] = userId

        if (!Array.isArray(items) || items.length == 0) {
            return res.status(400).send({ status: false, message: "items should present and it should be in array  ,not a empty array" })
        }

        if (!validator.isValidNumber(totalPrice) || totalPrice == 0) {
            return res.status(400).send({ status: false, message: "total price should be number and it should not be zero" })
        }

        if (!validator.isValidNumber(totalItems) || totalItems == 0) {
            return res.status(400).send({ status: false, message: "totalItems should be number and it should not be zero" })
        }

        let totalQuantity = 0
        for (i = 0; i < items.length; i++) {
            if (!validator.isValidObjectId(items[i].productId)) {
                return res.status(400).send({ status: false, message: `productId at  index ${i} is not valid objectId ` })
            }
            if (!validator.isValidNumber(items[i].quantity)  || items[i].quantity == 0) {
                return res.status(400).send({ status: false, message: `quantity at index ${i} is not a valid number` })
            }
            totalQuantity = totalQuantity + items[i].quantity
                                      
        }
        requestBody['totalQuantity'] = totalQuantity

        if (validator.isValidString(status)) {
            if (!(["pending", "completed", "cancelled"].includes(status))) {
                return res.status(400).send({ status: false, message: "status is in valid" })
            }
        }
        if (validator.isValidString(cancellable)) {
            if (cancellable != 'true' || cancellable != 'false') {
                return res.status(400).send({ status: false, message: "cancellable is in valid" })
            }
        }

        const ordercreation = await orderModel.create(requestBody)
        return res.status(201).send({ status: true, message: "successfully order created", data: ordercreation })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}


// -----------------------------------------------------------------------------------------------------------------------


const updateOrder = async function (req, res) {
    try {

        const userId = req.params.userId
        const requestBody = req.body

        const { orderId, status } = requestBody   

        // authorization
        if (req.userId != userId) {
            return res.status(403).send({ status: false, message: "you are not authorized" })
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

        const isOrderExists = await orderModel.findById(orderId)
        if (!isOrderExists) {
            return res.status(404).send({ status: false, message: "orderData not found" })
        }

        if (isOrderExists.userId != userId) {
            return res.status(400).send({ status: false, message: "order  not belongs to the user" })
        }

        if (validator.isValidString(status)) {
            if (!(["pending", "completed", "cancelled"].includes(status))) {
                return res.status(400).send({ status: false, message: "status is in valid" })
            }
        } else {
            return res.status(400).send({ status: false, message: "provide status for update" })
        }
       
        const updatedData = await orderModel.findOneAndUpdate({ _id: orderId, cancellable: true }, { status: status }, { new: true })

        if (!updatedData) {
            return res.status(404).send({ status: false, message: "data not found for update" })
        }

        return res.status(200).send({ status: true, message: "order Cancelled successfully", data: updatedData })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}






module.exports = { createOrder, updateOrder }