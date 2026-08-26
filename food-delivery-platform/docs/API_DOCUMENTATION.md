# API Documentation — AI-Powered Food Delivery Platform

Base URL: `/api`
Protocol: HTTPS (HTTP in dev)
Content-Type: `application/json`

---

## 1. Authentication

Most endpoints require a **Bearer JWT**:

```
Authorization: Bearer <access_token>
```

- **Public**: registration, login, password reset, browsing restaurants/menus.
- **Protected**: profile, orders, cart, payments, reviews, AI features.
- **Admin-only**: user/role management, platform analytics.

Roles: `customer`, `restaurant_owner`, `admin`.

Token obtained from `POST /auth/login`; expires per `JWT_EXPIRES_IN`.

---

## 2. Common Headers & Responses

### Request
```
POST /api/orders
Content-Type: application/json
Authorization: Bearer <token>

{
  "restaurant_id": "uuid",
  "address_id": "uuid",
  "items": [ ... ],
  "payment_method": "stripe"
}
```

### Success
```
200 OK / 201 Created
{
  "success": true,
  "data": { ... },
  "message": "optional message"
}
```

### Error
```
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [ ... ]
  }
}
```

### Pagination (list endpoints)
Query params: `?page=1&limit=20&sort=-created_at`
Response includes:
```
{
  "data": [ ... ],
  "pagination": { "page": 1, "limit": 20, "total": 137, "pages": 7 }
}
```

---

## 3. Endpoints

### 3.1 Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | Public | Register a new user. |
| POST | `/auth/login` | Public | Authenticate, return JWT. |
| POST | `/auth/refresh` | Refresh token | Issue new access token. |
| POST | `/auth/logout` | User | Invalidate session/token. |
| POST | `/auth/forgot-password` | Public | Send reset link. |
| POST | `/auth/reset-password` | Public | Set new password. |
| GET  | `/auth/me` | User | Current user profile. |

**POST /auth/register**
```
{
  "email": "user@example.com",
  "password": "Secret123!",
  "first_name": "Jane",
  "last_name": "Doe",
  "phone": "+1-555-0100",
  "role": "customer"
}
→ 201 { "data": { "id": "uuid", "email": "...", "token": "jwt" } }
```

**POST /auth/login**
```
{ "email": "user@example.com", "password": "Secret123!" }
→ 200 { "data": { "token": "jwt", "refresh_token": "...", "user": {...} } }
```

---

### 3.2 Users
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users/:id` | User/Admin | Get user by id. |
| PATCH | `/users/:id` | Owner/Admin | Update profile. |
| DELETE | `/users/:id` | Admin | Deactivate user. |
| GET | `/users/:id/addresses` | Owner | List saved addresses. |
| POST | `/users/:id/addresses` | Owner | Add address. |

**POST /users/:id/addresses**
```
{
  "label": "Home",
  "address_line1": "123 Main St",
  "city": "San Francisco",
  "state": "CA",
  "zip_code": "94102",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "is_default": true
}
```

---

### 3.3 Restaurants
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/restaurants` | Public | List/search restaurants. |
| GET | `/restaurants/:id` | Public | Restaurant details. |
| GET | `/restaurants/:id/menu` | Public | Menu items for a restaurant. |
| POST | `/restaurants` | Owner/Admin | Create restaurant. |
| PATCH | `/restaurants/:id` | Owner/Admin | Update restaurant. |
| DELETE | `/restaurants/:id` | Owner/Admin | Deactivate. |

**GET /restaurants** (query/filter)
```
GET /api/restaurants?city=San%20Francisco&cuisine=italian&is_open=true&min_rating=4
→ 200 { "data": [ { "id","name","cuisine_type":["italian"],"rating":4.5, ... } ] }
```

---

### 3.4 Menu Items
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/menu-items` | Public | List menu items (filter by restaurant/category). |
| GET | `/menu-items/:id` | Public | Item details. |
| POST | `/menu-items` | Owner/Admin | Add menu item. |
| PATCH | `/menu-items/:id` | Owner/Admin | Update item. |
| DELETE | `/menu-items/:id` | Owner/Admin | Remove item. |

**POST /menu-items**
```
{
  "restaurant_id": "uuid",
  "name": "Margherita Pizza",
  "description": "Classic tomato and mozzarella",
  "price": 12.99,
  "category": "Pizza",
  "is_vegetarian": true,
  "is_vegan": false,
  "spice_level": 0,
  "calories": 800,
  "preparation_time": 15
}
```

---

### 3.5 Cart
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/cart` | User | Get current cart items. |
| POST | `/cart/items` | User | Add item to cart. |
| PATCH | `/cart/items/:id` | User | Update quantity. |
| DELETE | `/cart/items/:id` | User | Remove item. |
| DELETE | `/cart` | User | Clear cart. |

**POST /cart/items**
```
{ "menu_item_id": "uuid", "quantity": 2, "special_requests": "extra cheese" }
```

---

### 3.6 Orders
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/orders` | User | Create an order from cart. |
| GET | `/orders` | User | List user's orders. |
| GET | `/orders/:id` | Owner/User | Order details. |
| PATCH | `/orders/:id/status` | Owner/Admin | Update status. |
| POST | `/orders/:id/cancel` | User/Owner | Cancel order. |

Order status flow: `pending → confirmed → preparing → out_for_delivery → delivered` (or `cancelled`).

**POST /orders**
```
{
  "restaurant_id": "uuid",
  "address_id": "uuid",
  "payment_method": "stripe",
  "special_instructions": "Leave at door"
}
→ 201 {
  "data": {
    "id": "uuid",
    "order_number": "ORD-20260826-0042",
    "status": "pending",
    "payment_status": "pending",
    "subtotal": 25.98,
    "delivery_fee": 2.99,
    "tax": 2.34,
    "total_amount": 31.31
  }
}
```

**PATCH /orders/:id/status**
```
{ "status": "preparing" }   // Owner/Admin only
```

---

### 3.7 Payments
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/payments/intent` | User | Create Stripe payment intent. |
| POST | `/payments/webhook` | Public (Stripe signed) | Stripe webhook handler. |
| GET | `/payments/:order_id` | Owner/User | Payment status. |

**POST /payments/intent**
```
{ "order_id": "uuid" }
→ 200 { "data": { "client_secret": "pi_..._secret", "amount": 3131, "currency": "usd" } }
```

---

### 3.8 Reviews
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/reviews?restaurant_id=&menu_item_id=` | Public | List reviews. |
| POST | `/reviews` | User | Submit a review. |
| DELETE | `/reviews/:id` | Owner/Admin | Remove review. |

**POST /reviews**
```
{
  "restaurant_id": "uuid",
  "menu_item_id": "uuid",
  "order_id": "uuid",
  "rating": 5,
  "comment": "Delicious!",
  "images": ["https://.../img.jpg"]
}
```

---

### 3.9 AI Features
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/recommendations` | User | Personalized menu recommendations. |
| GET | `/recommendations/trending` | Public | Trending items. |
| POST | `/chatbot` | User/Public | Conversational assistant. |

**GET /recommendations**
```
→ 200 {
  "data": [
    { "menu_item_id":"uuid", "recommendation_type":"content_based",
      "score":0.92, "reason":"Matches your love of Italian cuisine" }
  ]
}
```

**POST /chatbot**
```
{ "session_id": "abc123", "message": "Suggest a vegan dinner under $15" }
→ 200 {
  "data": {
    "response": "I recommend the Vegetable Ramen...",
    "intent": "recommendation",
    "confidence": 0.87
  }
}
```

---

### 3.10 Images
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/images/upload` | Owner/Admin | Get presigned URL / upload. |
| DELETE | `/images/:key` | Owner/Admin | Delete image from S3. |

**POST /images/upload**
```
{ "file_name": "pizza.jpg", "content_type": "image/jpeg" }
→ 200 { "data": { "upload_url": "https://s3.../presigned", "image_url": "https://.../pizza.jpg" } }
```

---

### 3.11 Notifications
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/notifications` | User | List notifications. |
| PATCH | `/notifications/:id/read` | User | Mark as read. |
| DELETE | `/notifications/:id` | User | Dismiss notification. |

---

### 3.12 Admin / Analytics
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/users` | Admin | List all users. |
| GET | `/admin/restaurants/analytics` | Admin/Owner | `restaurant_analytics` view. |
| GET | `/admin/popular-items` | Admin/Owner | `popular_items` view. |
| GET | `/admin/audit-logs` | Admin | Security audit trail. |

---

## 4. Health & Misc
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | Public | Backend liveness (used by Docker/ALB). |

Response: `200 { "status": "ok", "uptime": 1234, "db": "connected" }`

---

## 5. Error Codes

| HTTP | Code | Meaning |
|------|------|---------|
| 400 | `VALIDATION_ERROR` | Request body failed validation. |
| 401 | `UNAUTHORIZED` | Missing/invalid/expired token. |
| 403 | `FORBIDDEN` | Authenticated but not permitted. |
| 404 | `NOT_FOUND` | Resource does not exist. |
| 409 | `CONFLICT` | Duplicate (e.g., email already registered). |
| 422 | `PAYMENT_FAILED` | Payment gateway rejected. |
| 429 | `RATE_LIMITED` | Too many requests. |
| 500 | `INTERNAL_ERROR` | Unhandled server error. |
| 503 | `SERVICE_UNAVAILABLE` | DB/Redis/cache unreachable. |

All error responses follow the `{ "success": false, "error": {...} }` shape.
Use the `code` field for programmatic handling and `message` for display.
