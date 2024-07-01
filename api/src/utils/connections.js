require('dotenv').config();
const OpenAI = require('openai');
const { Pinecone } = require('@pinecone-database/pinecone');

// Initialize OpenAI
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// Initialize Pinecone
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
});

const indexName = 'conversations';
const index = pinecone.index(indexName);

async function initializeIndex() {
  try {
    // Check if the index exists
    await pinecone.describeIndex(indexName);
    console.log(`Index "${indexName}" already exists.`);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      // Index does not exist, create it
      await pinecone.createIndex({
        name: indexName,
        dimension: 512, // Adjust the dimension based on your model
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1',
          },
        },
      });
      console.log(`Index "${indexName}" created.`);
    } else {
      throw error;
    }
  }
}

async function queryPinecone(vector) {
  const response = await index.query({
    vector: vector,
    topK: 10,
    includeMetadata: true,
  });
  return response;
}

// Function to upsert vectors into Pinecone
async function upsertVectors(vectors) {
  try {
    await index.upsert(vectors);
    console.log('Vectors upserted successfully.');
  } catch (error) {
    console.error('Error upserting vectors:', error);
  }
}


async function getEmbeddings(text) {
  console.log('Using placeholder OpenAI API key. Skipping API call.');
  return Array(512).fill(0); // Return a mock embedding vector

  // const response = await openai.embeddings.create({
  //   model: 'text-embedding-ada-002',
  //   input: text,
  // });
  // return response.data[0].embedding;
}

module.exports = { initializeIndex, getEmbeddings, upsertVectors, queryPinecone };
