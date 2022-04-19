const express = require('express')
const cors = require('cors')
const route = require('../src/routes/route')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const app = express();
const multer = require('multer')


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}))
app.use(multer().any())

mongoose.connect("mongodb://ankurmongo:NeELgOTzdVxO9bz3@cluster0-shard-00-00.8xueo.mongodb.net:27017,cluster0-shard-00-01.8xueo.mongodb.net:27017,cluster0-shard-00-02.8xueo.mongodb.net:27017/group16Database?ssl=true&replicaSet=atlas-a37e86-shard-0&authSource=admin&retryWrites=true&w=majority",{
    useNewUrlParser: true,useUnifiedTopology: true
})
.then( () => console.log("MongoDb is connected"))
.catch ( err => console.log(err) )

app.use('/',route)


app.listen(process.env.PORT || 3000, function () {
    console.log('Express app running on port ' + (process.env.PORT || 3000))
});


