require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cron = require('node-cron');
const { getEmbeddings, queryPinecone, initializeIndex } = require('./src/utils/connections');
const ChatBackup = require('./src/models/ChatBackup');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
  console.debug('Debugging is enabled');
});

// Initialize Pinecone index
initializeIndex().then(() => {
  console.log('Pinecone index initialized');
});

let messageBatch = [];

app.post('/store-message', async (req, res) => {
  console.log('Storing message in MongoDB and batching for Pinecone');
  const { message } = req.body;
  const newMessage = new ChatBackup({ message });
  await newMessage.save();
  messageBatch.push(newMessage);
  res.status(201).send('Message stored and batched for processing');
});

app.post('/retrieve-context', async (req, res) => {
  const { query } = req.body;
  const embeddings = await getEmbeddings(query);
  const results = await queryPinecone(embeddings);
  res.status(200).json(results);
});

cron.schedule('0 * * * *', async () => {
  const batch = [...messageBatch];
  messageBatch = [];

  for (let message of batch) {
    const embeddings = await getEmbeddings(message.message);
    await upsertVectors([{
      id: message._id.toString(),
      values: embeddings,
      metadata: { message: message.message },
    }]);
  }
});

// After all other route definitions
app.use('*', (req, res) => {
  console.log(`404 Not Found: ${req.originalUrl}`);
  res.status(404).send('404 Not Found');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
