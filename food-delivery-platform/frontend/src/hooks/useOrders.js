import { useState, useCallback, useEffect } from 'react';
import { orderAPI } from '../services/api';

export function useOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderAPI.getAll();
      setOrders(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, []);

  const createOrder = useCallback(async (orderData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderAPI.create(orderData);
      setOrders((prev) => [response.data, ...prev]);
      return { success: true, data: response.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create order';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const trackOrder = useCallback(async (orderId) => {
    try {
      const response = await orderAPI.track(orderId);
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message };
    }
  }, []);

  const updateOrderStatus = useCallback(async (orderId, status) => {
    try {
      await orderAPI.updateStatus(orderId, status);
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? { ...order, status } : order))
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message };
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    fetchOrders,
    createOrder,
    trackOrder,
    updateOrderStatus,
  };
}
