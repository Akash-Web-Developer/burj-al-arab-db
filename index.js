const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

//for firebase admin setup
const admin = require('firebase-admin');

require('dotenv').config()

const port = 5000


const app = express()
app.use(cors());
app.use(bodyParser.json());


//from firebase Admin SDK

var serviceAccount = require("./configs/burj-auth-al-arab-firebase-adminsdk-417b3-6264d727e2.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

//Connection with Server
const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7gqmj.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const bookings = client.db("burjAlArab").collection("bookings");


  app.post('/addBooking', (req, res) => {
    const newBooking = req.body;
    bookings.insertOne(newBooking)
      .then(result => {
        res.send(insertCount > 0)
      })
    console.log(newBooking);
  })

  app.get('/bookings', (req, res) => {
    const bearer = req.headers.authorization;

    //Authorization Check Condition
    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1];
      console.log(idToken);


      // idToken comes from the client app
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          //Verify email
          if (tokenEmail == queryEmail) {
            bookings.find({ email: queryEmail })
              .toArray((err, documents) => {
                res.status(200).send(documents);
              })
          }
          else{
            res.status(401).send('Unauthorized Access');
          }
        })
        .catch((error) => {
          res.status(401).send('Unauthorized Access');
        });
    }

    else{
      res.status(401).send('Unauthorized Access');
    }
  })

});

app.listen(port)