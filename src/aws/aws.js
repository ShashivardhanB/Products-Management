

const aws = require('aws-sdk')

aws.config.update({
    accessKeyId: "AKIAY3L35MCRVFM24Q7U",
    secretAccessKey: "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",
    region: "ap-south-1"
})

const uploadFile = async (file) => {
    return new Promise(function (resolve, reject) {

        const s3 = new aws.S3({ appVersion: '2006-03-01' })

        const uploadParams = {
            ACL: "public-read",
            Bucket: "classroom-training-bucket",
            Key: "shoppingCart /" + file.originalname,
            Body: file.buffer
        }

        s3.upload(uploadParams, function (err, data) {

            if (err) return reject({ error: err })
            console.log(" file uploaded succesfully ")
            return resolve(data.Location)
        })

    }
    )
}

module.exports={uploadFile}