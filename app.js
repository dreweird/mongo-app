const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const config = require('./config');
const authJwt = require('./verifyJWToken');

const db_name = "test";

var app = Express();

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));

var database, collection;

if (app.get('env') === 'production') {
   app.use(function(req, res, next) {
     var protocol = req.get('x-forwarded-proto');
     protocol == 'https' ? next() : res.redirect('https://' + req.hostname + req.url);
   });
 }


app.listen(config.LISTEN_PORT, () => {
   MongoClient.connect(config.MONGO_URI, { useNewUrlParser: true }, function(err, client) {
      if(err) {
           console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
      }
      database = client.db(db_name);
      collection = database.collection("interventions");
      console.log('listening on port ' + config.LISTEN_PORT);
      console.log("Connected to `" + db_name + "`!");

   });
});

app.post("/register", (request, response) => {
   let hashedPassword = bcrypt.hashSync(request.body.password, 8);
   request.body.password = hashedPassword;
   collection.insertOne(request.body, (error, result) => {
       if(error) {
           return response.status(500).send(error);
       }
       var token = jwt.sign({ id: result._id }, 'supersecret', {
         expiresIn: 86400 // expires in 24 hours
       });
       response.send({auth: true, token: token});
   });
});

app.post("/login", (req, res) => {
   let hashedPassword = bcrypt.hashSync(req.body.password, 8);
   collection.findOne({name: req.body.name}, function(err, user){
      if (err){
			if(err.kind === 'ObjectId') {
				return res.status(404).send({
					message: "User not found with Username = " + req.body.name
				});                
			}
			return res.status(500).send({
				message: "Error retrieving User with Username = " + req.body.name
			});
      }
      var passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
      if (!passwordIsValid) {
			return res.status(401).send({ auth: false, accessToken: null, reason: "Invalid Password!" });
		}
     var token = jwt.sign({ id: user._id }, config.TOKEN_SECRET, {
      expiresIn: 86400 // expires in 24 hours
    });
    res.status(200).send({ auth: true, accessToken: token });
   });
});

app.get("/people", [authJwt.verifyToken], (request, response) => {
   collection.find({}).toArray((error, result) => {
       if(error) {
           return response.status(500).send(error);
       }
       response.send(result);
   });
});

app.get("/person/:id", (request, response) => {
   collection.findOne({ "_id": new ObjectId(request.params.id) }, (error, result) => {
       if(error) {
           return response.status(500).send(error);
       }
       response.send(result);
   });
});





