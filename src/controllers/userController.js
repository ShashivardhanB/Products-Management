const userModel = require('../models/userModel')
const validator = require('../validators/validator')
const bcrypt = require('bcrypt')
const saltRounds = 10;
const jwt = require('jsonwebtoken')
const awsFile = require('../aws/aws');



// *************************************************Create User API ************************************************************//

const createUser = async function (req, res) {

    try {
        let files = req.files
        const requestBody = req.body


        let { fname, lname, email, phone, password, address } = requestBody

        //validating the requestBody
        if (!validator.isValidChar(fname)) {
            return res.status(400).send({ status: false, message: "first name is mandatory and valid" })
        }
        if (!validator.isValidChar(lname)) {
            return res.status(400).send({ status: false, message: "lname name is mandatory  and valid" })
        }
        if (!validator.isValidEmail(email)) {
            return res.status(400).send({ status: false, message: "email  is mandatory  and valid " })
        }
        if (!validator.isValidPhoneNumber(phone)) {
            return res.status(400).send({ status: false, message: "phone number is mandatory  and " })
        }


        // checking for password length 
        if (password.length < 8 || password.length > 15) {
            return res.status(400).send({ status: false, mesaage: "password length should be inbetween 8 and 15 " })
        }
        if (!validator.isValidStrongPassword(password)) {
            return res.status(400).send({ status: false, message: "password  is mandatory and make sure the password is strong Example: Password@123" })
        }
        if (!validator.isValid(address)) {
            return res.status(400).send({ status: false, message: "address  is mandatory and valid" })
        }


        address = JSON.parse(address)


        if (!validator.isValidAddress(address)) {
            return res.status(400).send({ status: false, message: "address is invalid" });
        }
        const { shipping, billing } = address

        if (!validator.isValidAddress(shipping) || !validator.isValidAddress(billing)) {
            return res.status(400).send({ status: false, mesaage: "shipping or billing is invalid " })
        }

        if (!validator.isValidStreet(shipping.street) || !validator.isValidCity(shipping.city) || !validator.isValidPincode(shipping.pincode)) {
            return res.status(400).send({ status: false, message: "All feilds are mandatory in shipping address and make sure all are valid " })
        }
        if (!validator.isValidStreet(billing.street) || !validator.isValidCity(billing.city) || !validator.isValidPincode(billing.pincode)) {
            return res.status(400).send({ status: false, message: "All feilds are mandatory in billing  address and make sure all are valid " })
        }


        requestBody['address'] = address


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



        if (files && files.length > 0) {
            requestBody['profileImage'] = await awsFile.uploadFile(files[0])
        } else {
            return res.status(400).send({ status: false, message: "please provide profile pic " })
        }
        //hashing the password by using bcrypt

        const salt = bcrypt.genSaltSync(saltRounds);
        requestBody['password'] = await bcrypt.hash(password, salt);


        let user = await userModel.create(requestBody)

        res.status(201).send({ status: true, message: 'Success', data: user })

    }
    catch (err) {
        res.status(500).send({ error: err.message })
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

        if (!validator.isValidEmail(email)) {
            return res.status(400).send({ status: false, mesaage: "provide email" })
        }
        // checking for password length 
        if (password.length < 8 || password.length > 15) {
            return res.status(400).send({ status: false, mesaage: "password length should be inbetween 8 and 15 " })
        }
       
        if (!validator.isValidStrongPassword(password)) {
            return res.status(400).send({ status: false, message: "password  is mandatory and make sure the password is strong Example: Password@123" })
        }

    
        //checking that user Exists or not
        const isUserExists = await userModel.findOne({ email: email })

        if (isUserExists) {
            const isPasswordCorrect = await bcrypt.compare(password, isUserExists.password);             //checking that password is correct or not
            if (!isPasswordCorrect) {
                return res.status(400).send({ status: false, message: "Invalid login credentials" })
            }
        } else {
            return res.status(400).send({ status: false, message: "email is not registered" })
        }

        //creating the jwt Token
        const token = jwt.sign({
            userId: isUserExists._id,
        }, "project5shoppingCart", { expiresIn: "1d" })

        res.header("Authorization", "Bearer " + token);
        return res.status(200).send({ status: true, message: "Success", data: { userId: isUserExists._id, token: token } })
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
        const userData = await userModel.findById( userId )
        if (!userData) {
            return res.status(404).send({ status: false, message: "data not found" })
        }

        //authorization
        if (req.userId !== userId) {
            return res.status(403).send({ status: false, mesaage: "you are not authorizated" })
        }

        return res.status(200).send({ status: true, message: "Success", data: userData })


    } catch (err) {
        return res.status(500).send({ status: false, message: err.mesaage })
    }
}


/*************************************************************update Profile API *************************************************************/


const updateProfile = async function (req, res) {
    try {

        const requestBody = req.body
        const userId = req.params.userId

        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, mesaage: "invalid body" })
        }

        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "please enter valid  userId" })
        }

        const isUserExists = await userModel.findById(userId)
        if (!isUserExists) {
            return res.status(404).send({ status: false, message: "user Data not found" })
        }

        //authorization
        if (req.userId !== userId) {
            return res.status(403).send({ status: false, mesaage: "you are not authorizated" })
        }

        let { fname, lname, email, phone, password, address } = requestBody                           //distructing the requestBody

        let finalFilter = {}

        //checking that input and  if valid assigning (key value)to the finalFilter to update
        if ('fname' in req.body) {
            if (!validator.isValidChar(fname)) {
                return res.status(400).send({ status: false, mesaage: "firstName is not valid to update" })
            }
            finalFilter["fname"] = fname
        }

        if ('lname' in req.body) {
            if (!validator.isValidChar(lname)) {
                return res.status(400).send({ status: false, mesaage: "lastName is not valid to update" })
            }
            finalFilter["lname"] = lname
        }


        if ('email' in req.body) {
            if (!validator.isValidEmail(email)) {
                return res.status(400).send({ status: false, message: "EMAIL is not valid to update" })
            }
            const isEmailAlreadyUsed = await userModel.findOne({ email ,_id:{$ne:userId}})                           //checking the email already used
            if (isEmailAlreadyUsed) {
                return res.status(400).send({ status: false, message: "email already used " })
            }
            finalFilter["email"] = email

        }


        if ('phone' in req.body) {
            if (!validator.isValidPhoneNumber(phone)) {
                return res.status(400).send({ status: false, message: " phoneNumber is not valid to update" });
            }
            const isphoneNumberAlreadyUsed = await userModel.findOne({ phone,_id:{$ne:userId} })                           //checking the number already used
            if (isphoneNumberAlreadyUsed) {
                return res.status(400).send({ status: false, message: "phoneNumber already used " })
            }
            finalFilter["phone"] = phone
        }

        // checking for password length 

        if ('password' in req.body) {
            if (password.length < 8 || password.length > 15) {
                return res.status(400).send({ status: false, mesaage: "password length should be inbetween 8 and 15 " })
            }
            if (!validator.isValidStrongPassword(password)) {
                return res.status(400).send({ status: false, message: "password  is mandatory and make sure the password is strong to update Example: Password@123" })
            }
            const salt = bcrypt.genSaltSync(saltRounds);
            const hashPassword = await bcrypt.hash(password, salt);
            finalFilter["password"] = hashPassword
        }

        if ('address' in req.body) {


            address = JSON.parse(address)

            if (!validator.isValidAddress(address)) {
                return res.status(400).send({ status: false, message: "address is invalid to update" });
            }
            const { shipping, billing } = address

            if (!validator.isValidAddress(shipping) || !validator.isValidAddress(billing)) {
                return res.status(400).send({ status: false, mesaage: "shipping or billing is invalid  to update" })
            }

            if (!validator.isValidStreet(shipping.street) || !validator.isValidCity(shipping.city) || !validator.isValidPincode(shipping.pincode)) {
                return res.status(400).send({ status: false, message: "All feilds are mandatory in shipping address and make sure all are valid  to update" })
            }
            if (!validator.isValidStreet(billing.street) || !validator.isValidCity(billing.city) || !validator.isValidPincode(billing.pincode)) {
                return res.status(400).send({ status: false, message: "All feilds are mandatory in billing  address and make sure all are valid  to update " })
            }

            finalFilter['address'] = address
        }

        // creating the aws link to update           
        let files = req.files
        
            if (files && files.length > 0) {

                const profileImage = await awsFile.uploadFile(files[0])

                if (profileImage) {
                    finalFilter["profileImage"] = profileImage
                }
            }
        
        const postData = await userModel.findOneAndUpdate({ _id: userId }, { $set: finalFilter }, { new: true })

        return res.status(200).send({ status: true, message: "Success", data: postData })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}


module.exports = { createUser, updateProfile, userLogin, userDetails }