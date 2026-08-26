import React, { createContext, useState, useCallback, useEffect } from 'react';

export const CartContext = createContext(null);

const CART_STORAGE_KEY = 'cart_items';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });
  const [restaurantId, setRestaurantId] = useState(null);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((menuItem, restaurant) => {
    setItems((prev) => {
      if (restaurantId && restaurantId !== restaurant.id) {
        const newItems = [{ ...menuItem, quantity: 1, restaurant }];
        setRestaurantId(restaurant.id);
        return newItems;
      }
      const existing = prev.find((item) => item.id === menuItem.id);
      if (existing) {
        return prev.map((item) =>
          item.id === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      if (!restaurantId) setRestaurantId(restaurant.id);
      return [...prev, { ...menuItem, quantity: 1, restaurant }];
    });
  }, [restaurantId]);

  const removeItem = useCallback((itemId) => {
    setItems((prev) => {
      const newItems = prev.filter((item) => item.id !== itemId);
      if (newItems.length === 0) setRestaurantId(null);
      return newItems;
    });
  }, []);

  const updateQuantity = useCallback((itemId, quantity) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity } : item))
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    setRestaurantId(null);
  }, []);

  const getSubtotal = useCallback(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const getItemCount = useCallback(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const value = {
    items,
    restaurantId,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getSubtotal,
    getItemCount,
    isEmpty: items.length === 0,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
