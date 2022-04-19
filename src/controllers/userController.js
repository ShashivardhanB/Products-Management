const userModel = require('../models/userModel')
const validator = require('../validators/validator')
const bcrypt = require('bcrypt')
const saltRounds = 10;
const jwt = require('jsonwebtoken')
const awsFile = require('../aws/aws');



// *************************************************Create User API ************************************************************//

const createUser = async function (req, res) {

    try {
        const requestBody = req.body

        let { fname, lname, email, phone, profileImage, password, address } = requestBody        //distructing the requestBody


        //validating the requestBody
        if (!validator.isValidString(fname)) {
            return res.status(400).send({ status: false, message: "first name is mandatory " })
        }
        if (!validator.isValidString(lname)) {
            return res.status(400).send({ status: false, message: "lname name is mandatory " })
        }
        if (!validator.isValidString(email)) {
            return res.status(400).send({ status: false, message: "email  is mandatory " })
        }
        if (!validator.isValidString(phone)) {
            return res.status(400).send({ status: false, message: "phone number is mandatory " })
        }
        if (!validator.isValidString(password)) {
            return res.status(400).send({ status: false, message: "password  is mandatory " })
        }
        if (!validator.isValidString(address)) {
            return res.status(400).send({ status: false, message: "address  is mandatory " })
        }

        if (!validator.isValidString(address.shipping.street) || !validator.isValidString(address.shipping.city) || !validator.isValidNumber(address.shipping.pincode)) {
            return res.status(400).send({ status: false, message: "All feilds are mandatory in shipping address " })
        }
        if (!validator.isValidString(address.billing.street) || !validator.isValidString(address.billing.city) || !validator.isValidNumber(address.billing.pincode)) {
            return res.status(400).send({ status: false, message: "All feilds are mandatory in shipping address " })
        }

        //checking the email is valid or not
        if (!/^([a-z0-9\.-]+)@([a-z0-9-]+).([a-z]+)$/.test(email.trim())) {
            return res.status(400).send({ status: false, message: "EMAIL is not valid" })
        }

        // checking the phone number is valid or not
        if (!(!isNaN(phone)) && /^(?:(?:\+|0{0,2})91(\s*[\ -]\s*)?|[0]?)?[789]\d{9}|(\d[ -]?){10}\d$/.test(phone.trim())) {
            return res.status(400).send({
                status: false, message: " PHONE NUMBER is not a valid mobile number",
            });
        }
        // checking the email already used or not
        const isEmailAlreadyUsed = await userModel.findOne({ email })
        if (isEmailAlreadyUsed) {
            return res.status(400).send({ status: false, message: "email already used " })
        }
        // checking the phone already used or not
        const isphoneNumberAlreadyUsed = await userModel.findOne({ phone })
        if (isphoneNumberAlreadyUsed) {
            return res.status(400).send({ status: false, message: "phone Number already used " })
        }

        //creating the AWS link
        let files = req.files
        if (files && files.length > 0) {                               // checking file is exist or not
            profileImage = await awsFile.uploadFile(files[0])
        } else {
            return res.status(400).send({ status: false, message: "please provide profile pic " })

        }
        //hashing the password by using bcrypt
        const salt = bcrypt.genSaltSync(saltRounds);
        const hashPassword = await bcrypt.hash(password, salt);

        let userData = {
            fname: fname,
            lname: lname,
            email: email,
            profileImage: profileImage,
            phone: phone,
            password: hashPassword,
            address: address
        }
        const userCreated = await userModel.create(userData)                        //creating the user
        return res.status(201).send({ status: true, message: "User created successfully", data: userCreated })

    } catch (err) {
        res.status(500).send({ mesaage: err.mesaage })
    }
}

//*********************************************************Login API************************************************************




const userLogin = async function (req, res) {

    try {
        const requestBody = req.body

        const { email, password } = requestBody                                            //distructing the requestBody


        // validating the requestBody
        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "provide email and password" })
        }
        if (!validator.isValidString(email)) {
            return res.status(400).send({ status: false, mesaage: "provide email" })
        }
        if (!validator.isValidString(password)) {
            return res.status(400).send({ status: false, mesaage: "provide password" })
        }


        //checking that user Exists or not
        const isUserExists = await userModel.findOne({ email: email })

        if (isUserExists) {
            const isPasswordCorrect = await bcrypt.compare(password, isUserExists.password);             //checking that password is correct or not
            if (!isPasswordCorrect) {
                return res.status(400).send({ status: false, message: "email or password is wrong" })
            }
        } else {
            return res.status(400).send({ status: false, message: "email or password is wrong" })
        }

        //creating the jwt Token
        const token = jwt.sign({
            userId: isUserExists._id,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600 * 24 * 7
        }, "project5shoppingCart")

        return res.status(200).send({ status: true, message: "User login successfull", data: { userId: isUserExists._id, token: token } })
    } catch (err) {
        return res.status(500).send({ status: false, message: err.mesaage })
    }
}


/************************************************************Get user Profile API*************************************************************************************/
const userDetails = async function (req, res) {


    try {

        const userId = req.params.userId

        //validating the userId
        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "please enter valid  userId" })
        }

        //checking userId exists nor not
        const userData = await userModel.findById({ _id: userId })

        if (!userData) {
            return res.status(404).send({ status: false, message: "data not found" })
        } else {

            return res.status(200).send({ status: true, message: "User profile details", data: userData })
        }

    } catch (err) {
        return res.status(500).send({ status: false, message: err.mesaage })
    }
}


/*************************************************************update Profile API *************************************************************/


const updateProfile = async function (req, res) {
    try {

        const requestBody = req.body
        const userId = req.params.userId

        if(!validator.isValidRequestBody(requestBody)){
            return res.status(400).send({status:false,mesaage:"invalid body"})
        }

//authorization
        if (req.userId !== userId) {
            return res.status(403).send({ status: false, mesaage: "you are not authorizated" })
        }

        const { fname, lname, email, phone, password, address } = requestBody                           //distructing the requestBody

        let finalFilter = {}

//checking that input and  if valid assigning (key value)to the finalFilter to update
        if (validator.isValidString(fname)) {
            finalFilter["fname"] = fname
        }
        if (validator.isValidString(lname)) {
            finalFilter["lname"] = lname
        }

        if (validator.isValidString(email)) {
            if (!/^([a-z0-9\.-]+)@([a-z0-9-]+).([a-z]+)$/.test(email.trim())) {
                return res.status(400).send({ status: false, message: "EMAIL is not valid" })
            }
            const isEmailAlreadyUsed = await userModel.findOne({ email })                           //checking the email already used
            if (isEmailAlreadyUsed) {
                return res.status(400).send({ status: false, message: "email already used " })
            }
            finalFilter["email"] = email

        }

        if (validator.isValidString(phone)) {
            if (!(!isNaN(phone)) && /^(?:(?:\+|0{0,2})91(\s*[\ -]\s*)?|[0]?)?[789]\d{9}|(\d[ -]?){10}\d$/.test(phone.trim())) {
                return res.status(400).send({ status: false, message: " PHONE NUMBER is not a valid mobile number" });
            }
            const isphoneNumberAlreadyUsed = await userModel.findOne({ phone })                           //checking the number already used
            if (isphoneNumberAlreadyUsed) {
                return res.status(400).send({ status: false, message: "phone Number already used " })
            }
            finalFilter["phone"] = phone
        }
        if (validator.isValidString(password)) {
            const salt = bcrypt.genSaltSync(saltRounds);
            const hashPassword = await bcrypt.hash(password, salt);
            finalFilter["password"] = hashPassword
        }

        if (validator.isValidString(address)) {
            if (validator.isValidString(address.shipping)) {

                if (address.shipping.street) {
                    if (!validator.isValidString(address.shipping.street)) {
                        return res.status(400).send({ status: false, mesaage: "street must be valid" })
                    }
                    finalFilter["address.shipping.street"] = address.shipping.street
                }
                if (address.shipping.pincode) {
                    if (!validator.isValidNumber(address.shipping.pincode)) {
                        return res.status(400).send({ status: false, mesaage: "shipping pincode must be number" })
                    }
                    finalFilter["address.shipping.pincode"] = address.shipping.pincode
                }

                if (address.shipping.city) {
                    if (!validator.isValidString(address.shipping.city)) {
                        return res.status(400).send({ status: false, mesaage: "city must be string" })
                    }
                    finalFilter["address.shipping.city"] = address.shipping.city
                }
            }

            if (validator.isValidString(address.billing)) {

                if (address.billing.street) {
                    if (!validator.isValidString(address.billing.street)) {
                        return res.status(400).send({ status: false, mesaage: " billing street must be valid" })
                    }
                    finalFilter["address.billing.street"] = address.billing.street
                }
                if (address.billing.pincode) {
                    if (!validator.isValidNumber(address.billing.pincode)) {
                        return res.status(400).send({ status: false, mesaage: "billing pincode must be number" })
                    }
                    finalFilter["address.billing.pincode"] = address.billing.pincode
                }

                if (address.billing.city) {
                    if (!validator.isValidString(address.billing.city)) {
                        return res.status(400).send({ status: false, mesaage: "city must be string" })
                    }
                    finalFilter["address.billing.city"] = address.billing.city
                }
            }
        }

       // creating the aws link to update           
        let files = req.files
        if (files) {
            if (files && files.length > 0) {

                const profileImage = await uploadFile(files[0])

                if (profileImage) {
                    finalFilter["profileImage"] = profileImage
                }
            }
        }


        const postData = await userModel.findOneAndUpdate({ _id: userId }, { $set: finalFilter }, { new: true })

        return res.status(200).send({ status: true, message: "User profile updated", data: postData })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}


module.exports = { createUser, updateProfile, userLogin, userDetails }