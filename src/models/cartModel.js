const mongoose = require("mongoose");

const ObjectId = mongoose.Schema.Types.ObjectId



const cartSchema = new mongoose.Schema({

    userId: {
        type: ObjectId,
        ref: "user",
        required: true,
        unique: true,
        trim: true
    },
    items: [{
        productId: {
            type: ObjectId,
            ref: "product",
            required: true,
            trim: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        }
    }],
    totalPrice: {
        type: Number,
        required: true
    },
    totalItems: {
        type: Number,
        required: true
    }


})

module.exports = mongoose.model("cart", cartSchema)