const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config()

const serviceAccount = require("./configs/burj-al-arab-bc730-firebase-adminsdk-bbqak-6235d85c77.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIRE_DB
});

const app = express()
app.use(cors());
app.use(bodyParser.json());

const port = 5000;

app.get('/', (req, res) =>{
    res.send('It is Working!');
})

const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.shjfg.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
//const uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0-shard-00-00.shjfg.mongodb.net:27017,cluster0-shard-00-01.shjfg.mongodb.net:27017,cluster0-shard-00-02.shjfg.mongodb.net:27017/burjAlArab?ssl=true&replicaSet=atlas-zplt2j-shard-0&authSource=admin&retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const bookings = client.db("burjAlArab").collection("bookings");
    console.log(err)
    app.post("/addBooking",  (req, res) => {
        const newBooking = req.body;
        bookings.insertOne(newBooking)
        .then(result =>{
            res.send(result.insertedCount > 0);
        })
    })

    app.get('/bookings', (req, res) => {
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            admin.auth().verifyIdToken(idToken)
                .then(function (decodedToken) {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email;
                    if (tokenEmail == queryEmail) {
                        bookings.find({ email: queryEmail})
                            .toArray((err, documents) => {
                                res.status(200).send(documents);
                            })
                    }
                    else{
                        res.status(401).send('un-authorized access')
                    }
                }).catch(function (error) {
                    res.status(401).send('un-authorized access')
                });
        }
        else{
            res.status(401).send('un-authorized access')
        }
    })
});

app.listen(process.env.PORT || port);