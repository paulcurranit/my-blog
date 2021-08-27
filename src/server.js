import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import { restart } from 'nodemon';
import path from 'path';

const app = express();

app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyParser.json());

const withDB = async (operations, res) => {
    try {
        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true });
        const db = client.db('my-blog');
    
        await operations(db);

        client.close();
     } catch (error) {
        res.status(500).json({ message: 'Error connecting to the db', error});
    } 
}

app.get('/api/articles/:name', async (req, res) => {
    withDB(async (db) => {
        const articleName = req.params.name;

        const articleInfo = await db.collection('articles').findOne({ name:articleName });
        res.status(200).json(articleInfo);
    }, res);
})

app.get('/hello', (req, res) => res.send('Dia is Muire duit!'));
app.get('/hello/:name', (req, res) => res.send(`Dia is Muire duit a ${req.params.name}`));
app.post('/hello', (req, res) => res.send(`Dia is Muire duit a ${req.body.name}`));

app.post('/api/articles/:name/upvote', async (req, res) => {
    withDB(async (db) => {
        const articleName = req.params.name;

        const articleInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                upvotes: articleInfo.upvotes + 1,
            },
        }, res);
    
        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });
    
        res.status(200).json(updatedArticleInfo);
    });
});

app.post('/api/articles/:name/addcomment', (req, res) => {
    const { username, text } = req.body;
    const articleName = req.params.name;

    withDB(async (db) => {
        const articleInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                comments: articleInfo.comments.concat({ username, text}),
            }
        });

        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });
    
        res.status(200).json(updatedArticleInfo);
    }, res);
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
});

app.listen(8000, ()=> console.log('Ag éisteact ar port 8000'));