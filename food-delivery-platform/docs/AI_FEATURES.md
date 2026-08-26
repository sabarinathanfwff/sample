# AI Features Documentation

## Overview

The AI-Powered Food Delivery Platform integrates artificial intelligence to enhance user experience through personalized recommendations and an intelligent chatbot assistant.

## 1. Recommendation System

### How It Works

The recommendation engine uses a hybrid approach combining:

#### Collaborative Filtering
- Analyzes order patterns from similar users
- Calculates Jaccard similarity between user order histories
- Recommends items ordered by users with similar tastes
- Formula: `similarity = intersection / union`

#### Content-Based Filtering
- Examines item attributes (cuisine, rating, price)
- Learns user preferences from order history
- Scores items based on cuisine match (50%), rating (30%), and price (20%)
- Recommends items that match the user's taste profile

#### Trending Items
- Aggregates order frequency across all users
- Normalizes scores based on total user base
- Identifies items gaining popularity in real-time

#### Hybrid Scoring
- Combines collaborative (60%) and content-based (40%) scores
- Provides diverse recommendations with explanatory reasons

### Usage

```javascript
// Get personalized recommendations for a user
GET /api/ai/recommendations/:userId

// Get trending items
GET /api/ai/recommendations/trending
```

## 2. AI Chatbot

### How It Works

The chatbot uses rule-based NLP with intent detection:

#### Intent Detection
- Matches user messages against predefined patterns
- Calculates confidence scores based on pattern match length
- Supports intents: `order_status`, `menu_recommendations`, `restaurant_info`, `delivery_info`, `greeting`, `thanks`

#### Response Generation
- Selects from predefined responses per intent
- Maintains chat history per session
- Returns confidence scores for detected intents

#### Chat History
- Stores conversation context per session ID
- Enables multi-turn conversations
- Supports session-based history retrieval

### Usage

```javascript
// Send a message to the chatbot
POST /api/ai/chat
{
  "message": "Where is my order?",
  "sessionId": "user123"
}

// Get chat history for a session
GET /api/ai/chat/history/:sessionId
```

## 3. User Preference Analysis

The system analyzes user order history to build preference profiles:

- **Preferred Cuisines**: Top 3 most ordered cuisines
- **Average Price Range**: Calculated from order history
- **Spice Preference**: Spicy vs mild based on order patterns
- **Dietary Preference**: Vegetarian vs non-vegetarian
- **Confidence Score**: Based on order volume (max 1.0 at 10+ orders)

### Usage

```javascript
POST /api/ai/analyze/preferences
{
  "userId": 123,
  "orderHistory": [
    { cuisine: "Italian", price: 12, spicy: false, vegetarian: true },
    { cuisine: "Indian", price: 13, spicy: true, vegetarian: false }
  ]
}
```

## 4. Integrating Real OpenAI API

To replace the mock chatbot with real OpenAI integration:

### Step 1: Install OpenAI SDK

```bash
npm install openai
```

### Step 2: Update Chatbot Service

```javascript
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const processMessage = async (message, sessionId) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful food delivery assistant." },
        { role: "user", content: message }
      ],
      max_tokens: 150
    });

    const response = completion.choices[0].message.content;

    return {
      sessionId,
      userMessage: message,
      botResponse: response,
      detectedIntent: 'openai',
      confidence: 1.0
    };
  } catch (error) {
    // Fallback to mock response
    return mockProcessMessage(message, sessionId);
  }
};
```

### Step 3: Add Environment Variable

```bash
# .env
OPENAI_API_KEY=your-api-key-here
```

## 5. Extending with Custom ML Models

### For Advanced Recommendations

Replace the mock scoring algorithms with a machine learning model:

#### Option A: Python-based ML Service

1. Create a separate Python service using Flask/FastAPI
2. Train a model using scikit-learn or TensorFlow
3. Deploy the model and call it from Node.js:

```javascript
const axios = require('axios');

const getMLRecommendations = async (userId) => {
  const response = await axios.post('http://ml-service:5000/recommend', {
    userId,
    topN: 10
  });
  return response.data.recommendations;
};
```

#### Option B: Use Pre-built ML Libraries

```bash
npm install @tensorflow/tfjs
```

Train a neural network for collaborative filtering:

```javascript
const tf = require('@tensorflow/tfjs');

const trainModel = (userItemMatrix) => {
  const model = tf.sequential();
  model.add(tf.layers.embedding({ inputDim: 1000, outputDim: 50 }));
  model.add(tf.layers.flatten());
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

  model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy' });
  return model;
};
```

### For Natural Language Understanding

Integrate a real NLP service:

```bash
npm install @tensorflow-models/universal-sentence-encoder
```

```javascript
const use = require('@tensorflow-models/universal-sentence-encoder');

const detectIntentWithML = async (message) => {
  const model = await use.load();
  const embeddings = await model.embed([message]);

  // Compare embeddings with intent embeddings
  const intentEmbeddings = await model.embed(intentPatterns);

  // Calculate cosine similarity
  const scores = tf.matMul(embeddings, intentEmbeddings, false, true);
  const bestIntent = await scores.argMax(-1).data();

  return { intent: intents[bestIntent[0]], confidence: scores.max().dataSync()[0] };
};
```

## 6. Mock Data

The current implementation uses mock data generators:

- **Mock Users**: 20 synthetic users with random order histories
- **Mock Menu Items**: 10 predefined items across multiple cuisines
- **Mock Chat Sessions**: In-memory session storage

To use real data, replace the mock generators with database queries:

```javascript
const getMockUsers = async () => {
  const result = await db.query('SELECT * FROM users');
  return result.rows;
};

const getMenuItems = async () => {
  const result = await db.query('SELECT * FROM menu_items');
  return result.rows;
};
```

## 7. Performance Considerations

- **Recommendation Caching**: Cache recommendations for 1 hour to reduce computation
- **Rate Limiting**: Implement rate limiting on AI endpoints
- **Async Processing**: Use message queues for heavy ML computations
- **Fallback Strategy**: Always have mock fallback when ML services are unavailable
