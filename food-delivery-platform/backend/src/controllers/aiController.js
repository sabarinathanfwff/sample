const db = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const aiService = require('../utils/aiService');
const logger = require('../utils/logger');

const getRecommendations = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { limit = 10 } = req.query;

    if (!userId) {
      const trending = await aiService.getTrendingItems(parseInt(limit));
      return res.json({
        type: 'trending',
        recommendations: trending,
      });
    }

    const recommendations = await aiService.getRecommendations(userId, parseInt(limit));

    if (recommendations.length === 0) {
      const trending = await aiService.getTrendingItems(parseInt(limit));
      return res.json({
        type: 'trending',
        recommendations: trending,
      });
    }

    res.json({
      type: 'personalized',
      recommendations,
    });
  } catch (error) {
    logger.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
};

const getPersonalizedRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    const recommendations = await aiService.generatePersonalizedRecommendations(userId);

    res.json({
      type: 'personalized',
      recommendations: recommendations.slice(0, parseInt(limit)),
    });
  } catch (error) {
    logger.error('Get personalized recommendations error:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
};

const getSimilarItems = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const { limit = 5 } = req.query;

    const similarItems = await aiService.getSimilarItems(menuItemId, parseInt(limit));

    res.json({
      menuItemId,
      similarItems,
    });
  } catch (error) {
    logger.error('Get similar items error:', error);
    res.status(500).json({ error: 'Failed to get similar items' });
  }
};

const getTrendingItems = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const trending = await aiService.getTrendingItems(parseInt(limit));

    res.json({
      type: 'trending',
      items: trending,
    });
  } catch (error) {
    logger.error('Get trending items error:', error);
    res.status(500).json({ error: 'Failed to get trending items' });
  }
};

const chatbot = async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const userId = req.user?.id;

    if (!message || !sessionId) {
      return res.status(400).json({ error: 'Message and sessionId are required' });
    }

    const result = await aiService.chatbot(message, sessionId, userId);

    res.json({
      message: result.response,
      intent: result.intent,
      confidence: result.confidence,
    });
  } catch (error) {
    logger.error('Chatbot error:', error);
    res.status(500).json({ error: 'Failed to process chatbot request' });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.params;
    const { limit = 50 } = req.query;

    let query = 'SELECT * FROM chatbot_conversations WHERE session_id = $1';
    const params = [sessionId];

    if (userId) {
      query += ' AND user_id = $2';
      params.push(userId);
    }

    query += ' ORDER BY created_at ASC LIMIT $3';
    params.push(parseInt(limit));

    const result = await db.query(query, params);

    res.json({
      sessionId,
      messages: result.rows,
    });
  } catch (error) {
    logger.error('Get chat history error:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
};

module.exports = {
  getRecommendations,
  getPersonalizedRecommendations,
  getSimilarItems,
  getTrendingItems,
  chatbot,
  getChatHistory,
};
