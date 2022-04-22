const mongoose = require('mongoose')



const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true;
}


const isValidNumber = function (value) {
  if (typeof value === 'undefined' || value === null) return false
  if (  isNaN(value)  ) return false
  if(value.toString().trim().length == 0) return false
  return true;
}


const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
  }

  const isValidObjectId = function (ObjectId) {
    return mongoose.Types.ObjectId.isValid(ObjectId)
}

const isValidChar = function(value) {
  if( /^[A-Za-z]+$/.test(value)) return true
  return false
}

const isValidStreet = function(value){
  if( /^[A-Za-z0-9\.\:\;\=\-\s]+$/.test(value)) return true
  return false
}


const isValidCity = function(value){
  if( /^[A-Za-z\s]+$/.test(value)) return true
  return false
}

const isValidPhoneNumber = function(value){
if( /^[6-9]{1}\d{9}$/.test(value.trim()))  return true
return false
}

const isValidEmail = function(value){
  if(/^([a-z0-9\.-]+)@([a-z0-9-]+).([a-z]+)$/.test(value.trim())) return true
  return false
}


const isValidAddress = function(value) {
  if (typeof(value) === "undefined" || value === null) return false;
  if (typeof(value) === "object" && Array.isArray(value) === false && Object.keys(value).length > 0) return true;
  return false;
};

const isValidPincode = function(value){
  if(/^[1-9][0-9]{5}$/.test(value))   return true
  return false
}
const isValidtitle = function(value){
  if( /^[A-Za-z\s]+$/.test(value)) return true
  return false
}

const isValidStrongPassword = function(value){
  if(/^((?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W]).{8,15})$/.test(value)) return true
  return false

}



module.exports = {isValid,isValidRequestBody,isValidObjectId,isValidNumber,isValidChar,isValidPhoneNumber,isValidEmail,isValidAddress,isValidStreet,isValidPincode,isValidStrongPassword,isValidCity,isValidtitle}
