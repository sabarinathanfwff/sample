import React, { useState, useEffect } from 'react';
import { restaurantAPI } from '../../services/api';
import RestaurantCard from '../../components/restaurant/RestaurantCard';
import SearchBar from '../../components/restaurant/SearchBar';
import FilterPanel from '../../components/restaurant/FilterPanel';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import styles from '../../styles/Home.module.css';

function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    cuisine: '',
    sortBy: 'rating',
    openNow: false,
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      try {
        const params = {};
        if (searchQuery) params.search = searchQuery;
        if (filters.cuisine) params.cuisine = filters.cuisine;
        params.sortBy = filters.sortBy;
        if (filters.openNow) params.openNow = true;

        const response = await restaurantAPI.getAll(params);
        setRestaurants(response.data);
      } catch (err) {
        setError('Failed to load restaurants');
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, [filters, searchQuery]);

  const categories = [
    { name: 'Pizza', icon: '🍕' },
    { name: 'Burger', icon: '🍔' },
    { name: 'Sushi', icon: '🍣' },
    { name: 'Chinese', icon: '🥡' },
    { name: 'Indian', icon: '🍛' },
    { name: 'Mexican', icon: '🌮' },
    { name: 'Dessert', icon: '🍰' },
    { name: 'Healthy', icon: '🥗' },
  ];

  const features = [
    { icon: '🤖', title: 'AI Recommendations', desc: 'Get personalized food suggestions powered by AI' },
    { icon: '⚡', title: 'Fast Delivery', desc: 'Track your order in real-time with smart routing' },
    { icon: '🏪', title: 'Top Restaurants', desc: 'Curated selection of the best local restaurants' },
    { icon: '💳', title: 'Easy Payment', desc: 'Multiple payment options with secure checkout' },
  ];

  return (
    <div className={styles.home}>
      <section className={styles.hero}>
        <h1>Delicious Food, Delivered Fast</h1>
        <p>Discover the best restaurants in your area with AI-powered recommendations</p>
        <div className={styles['hero-search']}>
          <SearchBar onSearch={setSearchQuery} />
        </div>
      </section>

      <section className={`container ${styles.categories}`}>
        <h2 className="section-title">Browse by Category</h2>
        <div className={styles['categories-grid']}>
          {categories.map((cat) => (
            <div
              key={cat.name}
              className={styles['category-card']}
              onClick={() => setFilters({ ...filters, cuisine: cat.name })}
            >
              <div className={styles['category-icon']}>{cat.icon}</div>
              <div className={styles['category-name']}>{cat.name}</div>
            </div>
          ))}
        </div>
      </section>

      <section className={`container ${styles['restaurants-section']}`}>
        <div className={styles['restaurants-header']}>
          <div>
            <h2 className="section-title">Restaurants Near You</h2>
            <p className="section-subtitle">{restaurants.length} restaurants available</p>
          </div>
        </div>

        <div className="grid grid-4">
          {loading ? (
            <LoadingSpinner text="Finding restaurants..." />
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : restaurants.length === 0 ? (
            <p>No restaurants found. Try adjusting your filters.</p>
          ) : (
            restaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))
          )}
        </div>
      </section>

      <section className={styles.features}>
        <div className="container">
          <h2 className="section-title text-center">Why Choose FoodHub?</h2>
          <div className={styles['features-grid']}>
            {features.map((feature, idx) => (
              <div key={idx} className={styles['feature-card']}>
                <div className={styles['feature-icon']}>{feature.icon}</div>
                <h3 className={styles['feature-title']}>{feature.title}</h3>
                <p className={styles['feature-desc']}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
