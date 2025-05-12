
```markdown
# Blog API Documentation

## Authentication

### Register User
**Endpoint:**  
`POST /api/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**  
201 Created
```json
{
  "success": true,
  "message": "User registered successfully"
}
```

**Possible Errors:**  
- 400 Bad Request: Missing required fields  
- 400 Bad Request: Email already registered  
- 500 Internal Server Error  

---

### Login User
**Endpoint:**  
`POST /api/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**  
200 OK
```json
{
  "success": true,
  "message": "Login successful",
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi...",
  "data": {
    "id": "65f1a2b3c8e74f001f2e4d52",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "reader",
    "avatar": "https://gravatar.com/avatar/abc123"
  }
}
```

**Possible Errors:**  
- 400 Bad Request: Missing email/password  
- 400 Bad Request: Invalid credentials  
- 500 Internal Server Error  

---

## User Management

### Get All Users
**Endpoint:**  
`GET /api/users`

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `role` (admin/author/reader)
- `status` (true/false)
- `search` (name/email search)

**Response:**  
200 OK
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalUsers": 25,
    "limit": 10
  },
  "appliedFilters": {...}
}
```

---

### Get User by ID
**Endpoint:**  
`GET /api/users/:id`

**Response:**  
200 OK
```json
{
  "success": true,
  "data": {
    "id": "65f1a2b3c8e74f001f2e4d52",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "reader",
    "avatar": "https://gravatar.com/avatar/abc123",
    "status": true,
    "createdAt": "2024-03-15T10:00:00.000Z"
  }
}
```

**Possible Errors:**  
- 400 Bad Request: Invalid ID format  
- 404 Not Found: User not found  
- 500 Internal Server Error  

---

### Change User Status
**Endpoint:**  
`PATCH /api/users/:id/status`

**Request Body:**
```json
{
  "status": false
}
```

**Response:**  
200 OK
```json
{
  "success": true,
  "message": "User status updated to inactive",
  "data": {...}
}
```

**Possible Errors:**  
- 400 Bad Request: Invalid status value  
- 403 Forbidden: Cannot deactivate own account  
- 404 Not Found: User not found  
- 500 Internal Server Error  

---

> Note: All user management endpoints require admin privileges.  
> Avatar URLs are automatically generated using Gravatar if not provided.
```

This documentation includes:
1. Consistent response formats
2. Error handling documentation
3. Query parameters for filtering
4. Authentication requirements
5. Sample requests/responses
6. Status code explanations

You can extend this further with:
- Authorization header requirements
- Rate limiting information
- API versioning
- Error response examples