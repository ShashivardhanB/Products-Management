const mongoose = require('mongoose')



const isValidString = function (value) {
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




module.exports = {isValidString,isValidRequestBody,isValidObjectId,isValidNumber}