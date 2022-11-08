const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Server is running');
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ovbuiyj.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        const services = client.db('serviceReview').collection('services');
        const reviews = client.db('serviceReview').collection('reviews')

        app.get('/limitservices', async (req, res) => {
            const query = {};
            const cursor = services.find({});
            const result = await cursor.limit(3).toArray();
            res.send(result);
        })

        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = services.find({});
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/detailservice/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const cursor = services.find(query);
            const service = await cursor.toArray();
            res.send(service);
        })

        app.get('/review/:id', async (req, res) => {
            const id = req.params.id;
            const query = { service: id };
            const cursor = reviews.find(query).sort({ time: -1 });
            const result = await cursor.toArray();
            //console.log(result);
            res.send(result);
        })

        app.post('/review', async (req, res) => {
            const data = req.body;
            const result = await reviews.insertOne(data);
            res.send(result);

        })
    }
    finally { }
}
run().catch(err => console.log(err.message))


app.listen(port, () => {
    console.log(`Server running on ${port}`);
})