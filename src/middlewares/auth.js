const jwt = require('jsonwebtoken')



const auth = async function (req, res, next) {

    try {
        const bearerHeader = req.header('Authorization', 'Bearer Token')

        if (!bearerHeader) {
            return res.status(400).send({ status: false, msg: "token is required" })
        }
      
        const bearer = bearerHeader.split(' ');
        const token = bearer[1];

        let decodetoken = jwt.verify(token, "project5shoppingCart")
  
        

        req.userId = decodetoken.userId
        next()

    }
    catch (error) {


        if (error.message == "invalid token") return res.status(401).send({ status: false, msg: "authentication failed May be your header part currupt" }) // failed ka 401 ?
        if (error.message.startsWith("Unexpected")) return res.status(401).send({ status: false, msg: "authentication failed May be your payload part currupt" }) // failed ka 401 ?
        if (error.message == "invalid signature") return res.status(401).send({ status: false, msg: "authentication failed May be your singature part currupt" }) // failed ka 401 ?
        if (error.message == "jwt expired") return res.status(401).send({ status: false, msg: "authentication failed May be your Token is Expired" }) // failed ka 401 ?

        return res.status(500).send({ status: false, msg: error.message })

    }


}




module.exports = { auth }












