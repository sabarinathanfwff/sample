-- ============================================
-- AI-Powered Food Delivery Platform
-- PostgreSQL Database Schema
-- ============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE user_role AS ENUM ('customer', 'restaurant_owner', 'admin');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE cuisine_type AS ENUM ('indian', 'chinese', 'italian', 'mexican', 'american', 'japanese', 'thai', 'mediterranean', 'vegan', 'desserts');

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role user_role NOT NULL DEFAULT 'customer',
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- RESTAURANTS TABLE
-- ============================================
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cuisine_type cuisine_type[] NOT NULL DEFAULT '{}',
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    image_url TEXT,
    cover_image_url TEXT,
    rating DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
    review_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_open BOOLEAN DEFAULT TRUE,
    opening_time TIME DEFAULT '10:00:00',
    closing_time TIME DEFAULT '22:00:00',
    delivery_time INTEGER DEFAULT 30, -- minutes
    minimum_order DECIMAL(10,2) DEFAULT 0.00,
    delivery_fee DECIMAL(10,2) DEFAULT 2.99,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_restaurants_owner ON restaurants(owner_id);
CREATE INDEX idx_restaurants_city ON restaurants(city);
CREATE INDEX idx_restaurants_rating ON restaurants(rating DESC);
CREATE INDEX idx_restaurants_active ON restaurants(is_active);

-- ============================================
-- MENU ITEMS TABLE
-- ============================================
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    image_url TEXT,
    category VARCHAR(100) NOT NULL,
    is_vegetarian BOOLEAN DEFAULT FALSE,
    is_vegan BOOLEAN DEFAULT FALSE,
    is_gluten_free BOOLEAN DEFAULT FALSE,
    spice_level INTEGER DEFAULT 0 CHECK (spice_level BETWEEN 0 AND 5),
    calories INTEGER,
    preparation_time INTEGER, -- minutes
    is_available BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_menu_items_featured ON menu_items(is_featured) WHERE is_featured = TRUE;

-- ============================================
-- USER ADDRESSES TABLE
-- ============================================
CREATE TABLE user_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(50) DEFAULT 'Home',
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_addresses_user ON user_addresses(user_id);

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    address_id UUID NOT NULL REFERENCES user_addresses(id),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status order_status DEFAULT 'pending',
    payment_status payment_status DEFAULT 'pending',
    payment_method VARCHAR(50),
    subtotal DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    special_instructions TEXT,
    estimated_delivery TIMESTAMP,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- ============================================
-- ORDER ITEMS TABLE
-- ============================================
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    special_requests TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ============================================
-- CART TABLE
-- ============================================
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    special_requests TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, menu_item_id)
);

CREATE INDEX idx_cart_items_user ON cart_items(user_id);

-- ============================================
-- REVIEWS TABLE
-- ============================================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    images TEXT[],
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reviews_restaurant ON reviews(restaurant_id);
CREATE INDEX idx_reviews_menu_item ON reviews(menu_item_id);

-- ============================================
-- AI RECOMMENDATIONS TABLE
-- ============================================
CREATE TABLE ai_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    menu_item_id UUID NOT NULL REFERENCES menu_items(id),
    recommendation_type VARCHAR(50) NOT NULL, -- 'collaborative', 'content_based', 'trending'
    score DECIMAL(5,4) NOT NULL CHECK (score >= 0 AND score <= 1),
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_recommendations_user ON ai_recommendations(user_id);
CREATE INDEX idx_ai_recommendations_item ON ai_recommendations(menu_item_id);

-- ============================================
-- CHATBOT CONVERSATIONS TABLE
-- ============================================
CREATE TABLE chatbot_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    intent VARCHAR(100),
    confidence DECIMAL(5,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chatbot_conversations_session ON chatbot_conversations(session_id);
CREATE INDEX idx_chatbot_conversations_user ON chatbot_conversations(user_id);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(255) UNIQUE,
    status payment_status DEFAULT 'pending',
    gateway_response JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_transaction ON payments(transaction_id);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'order', 'promotion', 'system'
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- ============================================
-- AUDIT LOG TABLE
-- ============================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number = 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(EXTRACT(EPOCH FROM NOW())::BIGINT % 10000::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_order_number BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- Update restaurant rating
CREATE OR REPLACE FUNCTION update_restaurant_rating()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating DECIMAL(3,2);
    review_cnt INTEGER;
BEGIN
    SELECT AVG(rating), COUNT(*) INTO avg_rating, review_cnt
    FROM reviews
    WHERE restaurant_id = NEW.restaurant_id;

    UPDATE restaurants
    SET rating = COALESCE(avg_rating, 0), review_count = COALESCE(review_cnt, 0)
    WHERE id = NEW.restaurant_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_restaurant_rating AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_restaurant_rating();

-- ============================================
-- SEED DATA
-- ============================================

-- Insert admin user (password: Admin@123)
INSERT INTO users (email, password_hash, first_name, last_name, role, is_verified)
VALUES ('admin@fooddelivery.com', '$2b$10$rQ7H8qZ8vX7Y8Z9aBcDeEeO2pQ3rS4tU5vW6xY7zA8bC9dE0fG1hI2', 'Admin', 'User', 'admin', TRUE);

-- Insert sample restaurant owner
INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_verified)
VALUES ('owner@pizza palace.com', '$2b$10$rQ7H8qZ8vX7Y8Z9aBcDeEeO2pQ3rS4tU5vW6xY7zA8bC9dE0fG1hI2', 'Mario', 'Rossi', '+1-555-0101', 'restaurant_owner', TRUE)
RETURNING id;

-- Insert sample restaurants
INSERT INTO restaurants (owner_id, name, description, cuisine_type, address, city, state, zip_code, phone, email, rating, review_count, is_active, is_open, delivery_time, minimum_order, delivery_fee)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'Pizza Palace', 'Authentic Italian pizzas with wood-fired crust', ARRAY['italian', 'american'], '123 Main St', 'San Francisco', 'CA', '94102', '+1-555-0102', 'info@pizzapalace.com', 4.5, 120, TRUE, TRUE, 30, 10.00, 2.99),
    ('00000000-0000-0000-0000-000000000001', 'Sushi Zen', 'Fresh Japanese sushi and ramen', ARRAY['japanese', 'asian'], '456 Oak Ave', 'San Francisco', 'CA', '94103', '+1-555-0103', 'hello@sushizen.com', 4.8, 85, TRUE, TRUE, 25, 15.00, 3.99),
    ('00000000-0000-0000-0000-000000000001', 'Spice Garden', 'Authentic Indian curries and tandoori', ARRAY['indian'], '789 Pine St', 'San Francisco', 'CA', '94104', '+1-555-0104', 'order@spicegarden.com', 4.3, 200, TRUE, TRUE, 35, 12.00, 2.49);

-- Insert sample menu items
INSERT INTO menu_items (restaurant_id, name, description, price, category, is_vegetarian, is_available, is_featured, rating, review_count, preparation_time)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'Margherita Pizza', 'Classic tomato and mozzarella', 12.99, 'Pizza', TRUE, TRUE, TRUE, 4.7, 50, 15),
    ('00000000-0000-0000-0000-000000000001', 'Pepperoni Pizza', 'Spicy pepperoni with cheese', 14.99, 'Pizza', FALSE, TRUE, TRUE, 4.8, 75, 18),
    ('00000000-0000-0000-0000-000000000001', 'Caesar Salad', 'Fresh romaine with parmesan', 8.99, 'Salads', TRUE, TRUE, FALSE, 4.2, 30, 5),
    ('00000000-0000-0000-0000-000000000002', 'Salmon Nigiri', 'Fresh Atlantic salmon', 18.99, 'Nigiri', FALSE, TRUE, TRUE, 4.9, 60, 10),
    ('00000000-0000-0000-0000-000000000002', 'Vegetable Ramen', 'Rich miso broth with noodles', 13.99, 'Ramen', TRUE, TRUE, FALSE, 4.5, 40, 15),
    ('00000000-0000-0000-0000-000000000003', 'Butter Chicken', 'Creamy tomato curry', 16.99, 'Curries', FALSE, TRUE, TRUE, 4.6, 90, 20),
    ('00000000-0000-0000-0000-000000000003', 'Biryani', 'Fragrant basmati rice with spices', 14.99, 'Rice', TRUE, TRUE, TRUE, 4.7, 100, 25);

-- ============================================
-- VIEWS FOR ANALYTICS
-- ============================================

CREATE OR REPLACE VIEW restaurant_analytics AS
SELECT
    r.id,
    r.name,
    r.city,
    COUNT(DISTINCT o.id) as total_orders,
    COALESCE(SUM(o.total_amount), 0) as total_revenue,
    COALESCE(AVG(r.rating), 0) as avg_rating,
    r.review_count,
    COUNT(DISTINCT o.user_id) as unique_customers
FROM restaurants r
LEFT JOIN orders o ON r.id = o.restaurant_id AND o.created_at >= NOW() - INTERVAL '30 days'
GROUP BY r.id, r.name, r.city, r.rating, r.review_count;

CREATE OR REPLACE VIEW popular_items AS
SELECT
    mi.id,
    mi.name,
    mi.restaurant_id,
    r.name as restaurant_name,
    COUNT(oi.id) as order_count,
    SUM(oi.quantity) as total_quantity,
    mi.rating,
    mi.price
FROM menu_items mi
JOIN restaurants r ON mi.restaurant_id = r.id
LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
GROUP BY mi.id, mi.name, mi.restaurant_id, r.name, mi.rating, mi.price
ORDER BY total_quantity DESC;

-- ============================================
-- GRANTS
-- ============================================
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO food_delivery_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO food_delivery_app;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO food_delivery_app;
GRANT EXECUTE ON FUNCTION generate_order_number() TO food_delivery_app;
GRANT EXECUTE ON FUNCTION update_restaurant_rating() TO food_delivery_app;
