const db = require('../config/database');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.client = null;
    this.useMock = process.env.USE_MOCK_AI === 'true' || !process.env.OPENAI_API_KEY;
  }

  async initialize() {
    if (this.useMock) {
      logger.info('AI Service initialized in MOCK mode');
      return;
    }

    try {
      const OpenAI = require('openai');
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      logger.info('AI Service initialized with OpenAI');
    } catch (error) {
      logger.error('Failed to initialize AI service:', error);
      this.useMock = true;
    }
  }

  async getRecommendations(userId, limit = 10) {
    try {
      if (this.useMock) {
        return this.getMockRecommendations(userId, limit);
      }

      const result = await db.query(
        `SELECT mi.*, r.name as restaurant_name, r.city, r.rating as restaurant_rating,
                ar.score, ar.reason, ar.recommendation_type
         FROM ai_recommendations ar
         JOIN menu_items mi ON ar.menu_item_id = mi.id
         JOIN restaurants r ON mi.restaurant_id = r.id
         WHERE ar.user_id = $1
         ORDER BY ar.score DESC, mi.rating DESC
         LIMIT $2`,
        [userId, limit]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error getting recommendations:', error);
      return [];
    }
  }

  async getMockRecommendations(userId, limit = 10) {
    const query = `
      SELECT mi.*, r.name as restaurant_name, r.city, r.rating as restaurant_rating,
             (mi.rating / 5.0 * 0.7 + RANDOM() * 0.3) as score,
             'Based on your preferences and trending items' as reason,
             'content_based' as recommendation_type
      FROM menu_items mi
      JOIN restaurants r ON mi.restaurant_id = r.id
      WHERE mi.is_available = TRUE AND r.is_active = TRUE
      ORDER BY mi.rating DESC, mi.review_count DESC
      LIMIT $1
    `;

    const result = await db.query(query, [limit]);
    return result.rows;
  }

  async generatePersonalizedRecommendations(userId) {
    try {
      const userHistory = await db.query(
        `SELECT DISTINCT mi.category, mi.is_vegetarian, mi.is_vegan, r.cuisine_type
         FROM orders o
         JOIN order_items oi ON o.id = oi.order_id
         JOIN menu_items mi ON oi.menu_item_id = mi.id
         JOIN restaurants r ON mi.restaurant_id = r.id
         WHERE o.user_id = $1
         ORDER BY o.created_at DESC
         LIMIT 20`,
        [userId]
      );

      const preferences = userHistory.rows;
      const categories = [...new Set(preferences.map(p => p.category))];
      const cuisines = [...new Set(preferences.flatMap(p => p.cuisine_type))];
      const isVegetarian = preferences.some(p => p.is_vegetarian);
      const isVegan = preferences.some(p => p.is_vegan);

      let query = `
        SELECT mi.*, r.name as restaurant_name, r.city, r.rating as restaurant_rating,
               (mi.rating / 5.0 * 0.6 + RANDOM() * 0.4) as score,
               'Personalized based on your order history' as reason,
               'content_based' as recommendation_type
        FROM menu_items mi
        JOIN restaurants r ON mi.restaurant_id = r.id
        WHERE mi.is_available = TRUE AND r.is_active = TRUE
      `;

      const params = [];
      let paramCount = 0;

      if (categories.length > 0) {
        paramCount++;
        query += ` AND mi.category = ANY($${paramCount}::text[])`;
        params.push(categories);
      }

      if (isVegetarian) {
        query += ' AND mi.is_vegetarian = TRUE';
      }

      if (isVegan) {
        query += ' AND mi.is_vegan = TRUE';
      }

      query += ` ORDER BY mi.rating DESC LIMIT $${paramCount + 1}`;
      params.push(10);

      const result = await db.query(query, params);

      for (const rec of result.rows) {
        await db.query(
          'INSERT INTO ai_recommendations (user_id, menu_item_id, recommendation_type, score, reason) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
          [userId, rec.id, 'content_based', rec.score, rec.reason]
        );
      }

      return result.rows;
    } catch (error) {
      logger.error('Error generating personalized recommendations:', error);
      return [];
    }
  }

  async chatbot(message, sessionId, userId = null) {
    try {
      const lowerMessage = message.toLowerCase();

      let intent = 'general';
      let confidence = 0.8;
      let response = '';

      if (lowerMessage.includes('order') && (lowerMessage.includes('track') || lowerMessage.includes('status'))) {
        intent = 'order_tracking';
        confidence = 0.9;
        response = 'I can help you track your order. Please provide your order number, or I can show you your recent orders. You can also check the "My Orders" section in your account.';
      } else if (lowerMessage.includes('cancel')) {
        intent = 'order_cancellation';
        confidence = 0.9;
        response = 'I can help you cancel your order. Please note that orders can only be cancelled within 5 minutes of placing them. Would you like to proceed with cancelling your most recent order?';
      } else if (lowerMessage.includes('menu') || lowerMessage.includes('food') || lowerMessage.includes('recommend')) {
        intent = 'menu_recommendation';
        confidence = 0.85;
        response = 'I can help you find the perfect meal! Based on popular choices, I recommend trying our featured dishes. What type of cuisine are you in the mood for? We have Italian, Japanese, Indian, and more!';
      } else if (lowerMessage.includes('delivery') || lowerMessage.includes('time')) {
        intent = 'delivery_info';
        confidence = 0.9;
        response = 'Our standard delivery time is 30-45 minutes depending on your location and the restaurant. You can see the estimated delivery time for each restaurant on their page.';
      } else if (lowerMessage.includes('payment') || lowerMessage.includes('pay')) {
        intent = 'payment_help';
        confidence = 0.9;
        response = 'We accept credit/debit cards, Apple Pay, Google Pay, and PayPal. All payments are secure and encrypted. If you have issues with payment, please contact our support team.';
      } else if (lowerMessage.includes('promo') || lowerMessage.includes('discount') || lowerMessage.includes('coupon')) {
        intent = 'promotions';
        confidence = 0.85;
        response = 'Check out our current promotions in the "Offers" section! We have daily deals, first-order discounts, and special weekend offers. Use code WELCOME10 for 10% off your first order!';
      } else if (lowerMessage.includes('refund')) {
        intent = 'refund_request';
        confidence = 0.9;
        response = 'I can help you with a refund request. Please provide your order number and the reason for the refund. Refunds are typically processed within 5-7 business days.';
      } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        intent = 'greeting';
        confidence = 0.95;
        response = 'Hello! Welcome to FoodDelivery. I\'m your AI assistant. How can I help you today? You can ask me about orders, recommendations, delivery, payments, and more!';
      } else {
        intent = 'general';
        confidence = 0.5;
        response = 'I\'m here to help! You can ask me about orders, menu recommendations, delivery information, payments, promotions, or any other questions about our food delivery service. What would you like to know?';
      }

      if (this.client && !this.useMock) {
        try {
          const completion = await this.client.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a helpful customer service assistant for a food delivery platform. Be concise, friendly, and helpful. Provide specific information about orders, delivery, menu items, and promotions when asked.',
              },
              { role: 'user', content: message },
            ],
            max_tokens: 150,
            temperature: 0.7,
          });

          response = completion.choices[0].message.content.trim();
          confidence = 0.95;
        } catch (error) {
          logger.error('OpenAI API error:', error.message);
        }
      }

      await db.query(
        'INSERT INTO chatbot_conversations (user_id, session_id, message, response, intent, confidence) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, sessionId, message, response, intent, confidence]
      );

      return { response, intent, confidence };
    } catch (error) {
      logger.error('Chatbot error:', error);
      return {
        response: 'I apologize, but I\'m having trouble processing your request right now. Please try again or contact our support team.',
        intent: 'error',
        confidence: 0,
      };
    }
  }

  async getTrendingItems(limit = 10) {
    try {
      const result = await db.query(
        `SELECT mi.*, r.name as restaurant_name, r.city,
                COUNT(oi.id) as order_count,
                SUM(oi.quantity) as total_quantity
         FROM menu_items mi
         JOIN restaurants r ON mi.restaurant_id = r.id
         LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
         WHERE mi.is_available = TRUE AND r.is_active = TRUE
         GROUP BY mi.id, r.name, r.city
         ORDER BY total_quantity DESC NULLS LAST, mi.rating DESC
         LIMIT $1`,
        [limit]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error getting trending items:', error);
      return [];
    }
  }

  async getSimilarItems(menuItemId, limit = 5) {
    try {
      const result = await db.query(
        `SELECT mi.*, r.name as restaurant_name, r.city,
                (mi.rating / 5.0) as similarity_score
         FROM menu_items mi
         JOIN restaurants r ON mi.restaurant_id = r.id
         JOIN menu_items source_mi ON source_mi.id = $1
         WHERE mi.id != $1
           AND mi.restaurant_id = source_mi.restaurant_id
           AND mi.category = source_mi.category
           AND mi.is_available = TRUE
         ORDER BY mi.rating DESC
         LIMIT $2`,
        [menuItemId, limit]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error getting similar items:', error);
      return [];
    }
  }
}

module.exports = new AIService();
