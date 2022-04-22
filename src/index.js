const express = require('express')
const route = require('../src/routes/route')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const app = express();
const multer = require('multer')


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}))
app.use(multer().any())

mongoose.connect("mongodb+srv://Shashi123:Shashi123@cluster0.ixqul.mongodb.net/Group16Database?retryWrites=true&w=majority",{
    useNewUrlParser: true,useUnifiedTopology: true
})
.then( () => console.log("MongoDb is connected"))
.catch ( err => console.log(err) )

app.use('/',route)


app.listen(process.env.PORT || 3000, function () {
    console.log('Express app running on port ' + (process.env.PORT || 3000))
});


