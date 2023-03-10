const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Server is running');
})

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized access' });
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        req.decoded = decoded;
        next();
    })
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ovbuiyj.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        const services = client.db('serviceReview').collection('services');
        const reviews = client.db('serviceReview').collection('reviews')

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.send({ token });
        })

        app.get('/limitservices', async (req, res) => {
            const query = {};
            const cursor = services.find({}).sort({ _id: -1 });
            const result = await cursor.limit(3).toArray();
            res.send(result);
        })

        app.get('/services', async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            const query = {};
            const cursor = services.find(query);
            const result = await cursor.skip(page * size).limit(size).toArray();
            const count = await services.estimatedDocumentCount();
            res.send({ count, result });
        })

        app.get('/detailservice/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const cursor = services.find(query);
            const service = await cursor.toArray();
            res.send(service);
        })

        app.post('/addservice', async (req, res) => {
            const service = req.body;
            const result = await services.insertOne(service);
            res.send(result);
        })

        app.get('/review/:id', async (req, res) => {
            const id = req.params.id;
            const query = { service: id };
            const cursor = reviews.find(query).sort({ time: -1 });
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/myreview', verifyJWT, async (req, res) => {
            const decoded = req.decoded;

            if (decoded.email !== req.query.email) {
                res.status(403).send({ message: 'Forbidden Access' })
            }
            let query = {};
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = reviews.find(query)
            const result = await cursor.toArray();
            res.send(result);
        })

        app.post('/review', async (req, res) => {
            const data = req.body;
            const result = await reviews.insertOne(data);
            res.send(result);

        })

        app.patch('/updatereview/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const data = req.body;
            const updatedDoc = {
                $set: {
                    comment: data.updateComment,
                }
            }
            const result = await reviews.updateOne(query, updatedDoc);
            res.send(result);
            //console.log(result);
        })

        app.delete('/deletereview/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await reviews.deleteOne(query);
            res.send(result);
        })
    }
    finally { }
}
run().catch(err => console.log(err.message))


app.listen(port, () => {
    console.log(`Server running on ${port}`);
})