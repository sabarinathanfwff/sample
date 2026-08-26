const menuItems = [
  { id: 1, name: 'Margherita Pizza', cuisine: 'Italian', price: 12, rating: 4.5, calories: 800, spicy: false, vegetarian: true },
  { id: 2, name: 'Pepperoni Pizza', cuisine: 'Italian', price: 14, rating: 4.7, calories: 850, spicy: false, vegetarian: false },
  { id: 3, name: 'Spicy Buffalo Wings', cuisine: 'American', price: 10, rating: 4.3, calories: 650, spicy: true, vegetarian: false },
  { id: 4, name: 'Pad Thai', cuisine: 'Thai', price: 11, rating: 4.6, calories: 700, spicy: true, vegetarian: false },
  { id: 5, name: 'Sushi Platter', cuisine: 'Japanese', price: 18, rating: 4.8, calories: 500, spicy: false, vegetarian: false },
  { id: 6, name: 'Chicken Tikka Masala', cuisine: 'Indian', price: 13, rating: 4.7, calories: 750, spicy: true, vegetarian: false },
  { id: 7, name: 'Caesar Salad', cuisine: 'American', price: 9, rating: 4.2, calories: 400, spicy: false, vegetarian: true },
  { id: 8, name: 'Beef Tacos', cuisine: 'Mexican', price: 8, rating: 4.4, calories: 600, spicy: true, vegetarian: false },
  { id: 9, name: 'Tomato Soup', cuisine: 'American', price: 6, rating: 4.1, calories: 250, spicy: false, vegetarian: true },
  { id: 10, name: 'Mushroom Risotto', cuisine: 'Italian', price: 15, rating: 4.6, calories: 600, spicy: false, vegetarian: true }
];

const generateMockUsers = (count = 20) => {
  const users = [];
  for (let i = 1; i <= count; i++) {
    const orders = [];
    const orderCount = Math.floor(Math.random() * 15) + 1;
    for (let j = 0; j < orderCount; j++) {
      orders.push(menuItems[Math.floor(Math.random() * menuItems.length)].id);
    }
    users.push({
      id: i,
      name: `User ${i}`,
      orders,
      favoriteCuisines: [...new Set(orders.map(id => menuItems.find(m => m.id === id).cuisine))]
    });
  }
  return users;
};

const mockUsers = generateMockUsers();

const collaborativeFiltering = (userId, topN = 5) => {
  const user = mockUsers.find(u => u.id === userId);
  if (!user) return [];

  const similarUsers = mockUsers
    .filter(u => u.id !== userId)
    .map(u => {
      const intersection = u.orders.filter(id => user.orders.includes(id));
      const union = [...new Set([...u.orders, ...user.orders])];
      return {
        userId: u.id,
        similarity: intersection.length / Math.max(union.length, 1)
      };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);

  const recommendedIds = new Set();
  similarUsers.forEach(u => {
    const similarUser = mockUsers.find(mu => mu.id === u.userId);
    similarUser.orders.forEach(id => {
      if (!user.orders.includes(id)) recommendedIds.add(id);
    });
  });

  return menuItems
    .filter(item => recommendedIds.has(item.id))
    .slice(0, topN)
    .map(item => ({ ...item, score: Math.random() * 0.4 + 0.6, reason: 'Users like you ordered this' }));
};

const contentBasedFiltering = (userId, topN = 5) => {
  const user = mockUsers.find(u => u.id === userId);
  if (!user) return [];

  const userPreferences = {};
  user.orders.forEach(id => {
    const item = menuItems.find(m => m.id === id);
    item.cuisine.split(',').forEach(c => {
      userPreferences[c.trim()] = (userPreferences[c.trim()] || 0) + 1;
    });
  });

  const maxPref = Math.max(...Object.values(userPreferences), 1);

  return menuItems
    .filter(item => !user.orders.includes(item.id))
    .map(item => {
      const cuisineMatch = userPreferences[item.cuisine] || 0;
      const ratingScore = item.rating / 5;
      const priceScore = Math.max(0, 1 - item.price / 20);
      const score = (cuisineMatch / maxPref) * 0.5 + ratingScore * 0.3 + priceScore * 0.2;
      return { ...item, score, reason: 'Matches your taste preferences' };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
};

const getTrendingItems = (topN = 5) => {
  const itemOrderCounts = {};
  mockUsers.forEach(u => {
    u.orders.forEach(id => {
      itemOrderCounts[id] = (itemOrderCounts[id] || 0) + 1;
    });
  });

  return menuItems
    .map(item => ({
      ...item,
      score: (itemOrderCounts[item.id] || 0) / mockUsers.length,
      reason: 'Trending now'
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
};

const getPersonalizedRecommendations = (userId, topN = 10) => {
  const collaborative = collaborativeFiltering(userId, topN * 2);
  const contentBased = contentBasedFiltering(userId, topN * 2);

  const scoreMap = {};

  collaborative.forEach(item => {
    if (!scoreMap[item.id]) {
      scoreMap[item.id] = { ...item, collaborativeScore: item.score, contentScore: 0 };
    } else {
      scoreMap[item.id].collaborativeScore = item.score;
    }
  });

  contentBased.forEach(item => {
    if (!scoreMap[item.id]) {
      scoreMap[item.id] = { ...item, collaborativeScore: 0, contentScore: item.score };
    } else {
      scoreMap[item.id].contentScore = item.score;
    }
  });

  return Object.values(scoreMap)
    .map(item => ({
      ...item,
      score: item.collaborativeScore * 0.6 + item.contentScore * 0.4,
      reason: item.collaborativeScore > item.contentScore ? 'Popular with similar users' : 'Matches your preferences'
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
};

module.exports = {
  getPersonalizedRecommendations,
  getTrendingItems,
  menuItems,
  mockUsers
};
