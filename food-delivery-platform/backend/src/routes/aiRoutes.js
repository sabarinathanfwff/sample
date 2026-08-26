const express = require('express');
const router = express.Router();

const recommendationEngine = require('../utils/recommendationEngine');
const chatbotService = require('../utils/chatbotService');

router.get('/recommendations/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const recommendations = recommendationEngine.getPersonalizedRecommendations(parseInt(userId));
    res.json({
      userId: parseInt(userId),
      count: recommendations.length,
      recommendations
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

router.get('/recommendations/trending', (req, res) => {
  try {
    const trending = recommendationEngine.getTrendingItems();
    res.json({
      count: trending.length,
      trending: trending
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trending items' });
  }
});

router.post('/chat', async (req, res) => {
  try {
    const { message, sessionId = 'default' } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const chatResponse = await chatbotService.processMessage(message, sessionId);
    chatbotService.addToHistory(sessionId, chatResponse);

    res.json({
      sessionId,
      response: chatResponse.botResponse,
      detectedIntent: chatResponse.detectedIntent,
      confidence: chatResponse.confidence
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

router.get('/chat/history/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const history = chatbotService.getChatHistory(sessionId);
    res.json({
      sessionId,
      count: history.length,
      history
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

router.post('/analyze/preferences', (req, res) => {
  try {
    const { userId, orderHistory } = req.body;

    if (!userId || !Array.isArray(orderHistory)) {
      return res.status(400).json({ error: 'userId and orderHistory are required' });
    }

    const preferences = chatbotService.analyzeFoodPreferences(userId, orderHistory);
    res.json({
      userId,
      preferences
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze preferences' });
  }
});

module.exports = router;
