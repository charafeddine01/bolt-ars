API for Admin and Products

Endpoints
- GET /api/health: Health check
- POST /api/auth/login: { username, password } -> { token, user }
- GET /api/products?enabled=true: List products (public)
- GET /api/products/:id: Get product (public)
- POST /api/products: Create (auth: Bearer token)
- PUT /api/products/:id: Update (auth)
- PATCH /api/products/:id/toggle: Toggle enabled (auth)
- DELETE /api/products/:id: Soft-delete (auth)

Setup
1. cd server
2. Copy .env.example to .env and adjust
3. npm install
4. npm run migrate && npm run seed
5. npm start

Env
- PORT=4000
- CORS_ORIGIN=http://localhost:5173
- JWT_SECRET=please-change
- JWT_EXPIRES_IN=1h
- ADMIN_USER=admin
- ADMIN_PASS=ChangeMe!123

