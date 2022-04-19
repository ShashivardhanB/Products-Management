const express = require('express')
const router =  express.Router();
const userController = require('../controllers/userController')
 const cartController = require('../controllers/cartController')
const authMiddleware = require("../middlewares/auth")
const productController = require('../controllers/productController')
const orderController = require('../controllers/orderController')


//users Routes
router.post('/register' , userController.createUser)
router.post('/login' , userController.userLogin)
router.get('/user/:userId/profile' ,authMiddleware.auth, userController.updateProfile)
router.put('/user/:userId/profile' ,authMiddleware.auth, userController.updateProfile)

//product Routes
router.post('/products' , productController.createProduct)
router.get('/products' , productController.productsDetails)
router.get('/products/:productId' , productController.getProductsById)
router.put('/products/:productId' , productController.updateProduct)
router.delete('/products/:productId' , productController.deleteProductByProductId)

//cart Routes
router.post('/users/:userId/cart',authMiddleware.auth, cartController.createCart)
router.put('/users/:userId/cart' ,authMiddleware.auth, cartController.updateCart)
router.get('/users/:userId/cart' , authMiddleware.auth,cartController.getCartDetails)
router.delete('/users/:userId/cart' ,authMiddleware.auth, cartController.deleteCart)

//orderRoutes
router.post('/users/:userId/orders' ,authMiddleware.auth, orderController.createOrder)
router.put('/users/:userId/orders' ,authMiddleware.auth, orderController.updateOrder)



module.exports=router
