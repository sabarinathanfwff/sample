const intents = [
  {
    name: 'order_status',
    patterns: ['where is my order', 'order status', 'track my order', 'when will my order arrive', 'delivery status'],
    responses: [
      'Your order is currently being prepared and will be delivered soon!',
      'I can see your order is on its way. Expected delivery in 15-20 minutes.',
      'Your order has been picked up by the delivery partner and is on its way!'
    ]
  },
  {
    name: 'menu_recommendations',
    patterns: ['what should i order', 'recommend something', 'suggest a dish', 'popular items', 'best food here'],
    responses: [
      'Based on popular choices, I recommend our Margherita Pizza or Chicken Tikka Masala!',
      'Our top rated items today are the Sushi Platter and Pad Thai. Would you like to know more?',
      'I can help you find the perfect dish! What cuisine are you in the mood for?'
    ]
  },
  {
    name: 'restaurant_info',
    patterns: ['restaurant hours', 'opening time', 'closing time', 'restaurant location', 'where are you located'],
    responses: [
      'We are open from 11:00 AM to 10:00 PM, 7 days a week.',
      'Our restaurant is located at 123 Food Street, Downtown. We offer both dine-in and delivery!',
      'Opening hours are 11 AM - 10 PM. Delivery is available within 5km radius.'
    ]
  },
  {
    name: 'delivery_info',
    patterns: ['delivery time', 'how long does delivery take', 'delivery fee', 'minimum order', 'free delivery'],
    responses: [
      'Delivery typically takes 30-45 minutes depending on your location.',
      'Our delivery fee is $2.99. Free delivery on orders over $20!',
      'The minimum order amount is $10. Delivery time is usually 30-40 minutes.'
    ]
  },
  {
    name: 'greeting',
    patterns: ['hello', 'hi', 'hey', 'good morning', 'good evening'],
    responses: [
      'Hello! How can I help you with your food order today?',
      'Hi there! Are you looking to place an order or need assistance?',
      'Hey! Welcome to our food delivery service. What can I get for you?'
    ]
  },
  {
    name: 'thanks',
    patterns: ['thank you', 'thanks', 'thx', 'appreciate it'],
    responses: [
      'You\'re welcome! Enjoy your meal!',
      'Happy to help! Let me know if you need anything else.',
      'Anytime! Have a great day!'
    ]
  }
];

const detectIntent = (message) => {
  const normalizedMessage = message.toLowerCase();
  let bestMatch = { name: 'unknown', confidence: 0 };

  intents.forEach(intent => {
    intent.patterns.forEach(pattern => {
      if (normalizedMessage.includes(pattern)) {
        const confidence = pattern.length / normalizedMessage.length;
        if (confidence > bestMatch.confidence) {
          bestMatch = { name: intent.name, confidence };
        }
      }
    });
  });

  return bestMatch;
};

const getResponse = (intentName) => {
  const intent = intents.find(i => i.name === intentName);
  if (!intent) return "I'm not sure I understand. Could you rephrase that?";
  const responses = intent.responses;
  return responses[Math.floor(Math.random() * responses.length)];
};

const processMessage = async (message, sessionId) => {
  const intent = detectIntent(message);
  const response = getResponse(intent.name);

  const chatHistory = {
    sessionId,
    timestamp: new Date().toISOString(),
    userMessage: message,
    botResponse: response,
    detectedIntent: intent.name,
    confidence: intent.confidence
  };

  return chatHistory;
};

const chatSessions = {};

const getChatHistory = (sessionId) => {
  return chatSessions[sessionId] || [];
};

const addToHistory = (sessionId, message) => {
  if (!chatSessions[sessionId]) {
    chatSessions[sessionId] = [];
  }
  chatSessions[sessionId].push(message);
  return chatSessions[sessionId];
};

const analyzeFoodPreferences = (userId, orderHistory) => {
  const cuisineCounts = {};
  const priceRange = { min: Infinity, max: -Infinity };
  const spicyCount = { true: 0, false: 0 };
  const vegCount = { true: 0, false: 0 };

  orderHistory.forEach(order => {
    if (order.cuisine) {
      cuisineCounts[order.cuisine] = (cuisineCounts[order.cuisine] || 0) + 1;
    }
    if (order.price !== undefined) {
      priceRange.min = Math.min(priceRange.min, order.price);
      priceRange.max = Math.max(priceRange.max, order.price);
    }
    if (order.spicy !== undefined) {
      spicyCount[order.spicy]++;
    }
    if (order.vegetarian !== undefined) {
      vegCount[order.vegetarian]++;
    }
  });

  const totalOrders = orderHistory.length || 1;
  const preferredCuisines = Object.entries(cuisineCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cuisine]) => cuisine);

  return {
    userId,
    totalOrders,
    preferredCuisines,
    avgPrice: priceRange.min !== Infinity ? (priceRange.min + priceRange.max) / 2 : 0,
    spicyPreference: spicyCount.true > spicyCount.false ? 'spicy' : 'mild',
    dietaryPreference: vegCount.true > vegCount.false ? 'vegetarian' : 'non-vegetarian',
    confidence: Math.min(totalOrders / 10, 1)
  };
};

module.exports = {
  processMessage,
  getChatHistory,
  addToHistory,
  analyzeFoodPreferences,
  intents
};
