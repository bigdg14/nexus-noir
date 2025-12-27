# API Documentation

Complete API reference for the Professional Network application.

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Authentication

All authenticated endpoints require a valid session cookie set by NextAuth.js. If the user is not authenticated, endpoints will return `401 Unauthorized`.

## Response Format

### Success Response

```json
{
  "data": { ... }
}
```

### Error Response

```json
{
  "error": "Error message",
  "details": [ ... ] // Optional, for validation errors
}
```

## HTTP Status Codes

- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Authentication

### Get Session

```http
GET /api/auth/session
```

Returns the current user session.

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "displayName": "Display Name",
    "avatar": "https://..."
  }
}
```

---

## Users

### Get Current User

```http
GET /api/users/me
```

Get the authenticated user's profile.

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "username",
  "displayName": "Display Name",
  "avatar": "https://...",
  "bio": "User bio",
  "profession": "Job Title",
  "location": "City, State",
  "privacyLevel": "PUBLIC|FRIENDS|PRIVATE",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "_count": {
    "posts": 10,
    "followers": 50,
    "following": 30,
    "sentFriendRequests": 20
  }
}
```

### Update Current User

```http
PATCH /api/users/me
```

Update the authenticated user's profile.

**Request Body:**
```json
{
  "displayName": "New Name",
  "bio": "Updated bio",
  "profession": "New Job Title",
  "location": "New City, State",
  "avatar": "https://s3.../new-avatar.jpg",
  "privacyLevel": "PUBLIC|FRIENDS|PRIVATE"
}
```

**Response:** Updated user object

### Get User by ID

```http
GET /api/users/:userId
```

Get a user's public profile.

**Response:**
```json
{
  "id": "uuid",
  "username": "username",
  "displayName": "Display Name",
  "avatar": "https://...",
  "bio": "User bio",
  "profession": "Job Title",
  "location": "City, State",
  "privacyLevel": "PUBLIC",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "_count": {
    "posts": 10,
    "followers": 50,
    "following": 30
  },
  "relationship": {
    "isFriend": true,
    "friendshipStatus": "ACCEPTED",
    "isFollowing": true
  }
}
```

### Search Users

```http
GET /api/users/search?q={query}&limit={limit}
```

Search for users by username, display name, or profession.

**Query Parameters:**
- `q` (required) - Search query (min 2 characters)
- `limit` (optional) - Results limit (default: 20)

**Response:**
```json
[
  {
    "id": "uuid",
    "username": "username",
    "displayName": "Display Name",
    "avatar": "https://...",
    "profession": "Job Title",
    "location": "City, State"
  }
]
```

---

## Posts

### Create Post

```http
POST /api/posts
```

Create a new post.

**Request Body:**
```json
{
  "content": "Post content",
  "mediaUrls": ["https://s3.../image.jpg"],
  "mediaType": "NONE|IMAGE|VIDEO",
  "privacyLevel": "PUBLIC|FRIENDS|PRIVATE"
}
```

**Response:**
```json
{
  "id": "uuid",
  "content": "Post content",
  "mediaUrls": ["https://..."],
  "mediaType": "IMAGE",
  "privacyLevel": "PUBLIC",
  "likeCount": 0,
  "commentCount": 0,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "author": {
    "id": "uuid",
    "username": "username",
    "displayName": "Display Name",
    "avatar": "https://..."
  }
}
```

### Get Post

```http
GET /api/posts/:postId
```

Get a single post by ID.

**Response:** Post object with `hasLiked` boolean

### Update Post

```http
PATCH /api/posts/:postId
```

Update a post (author only).

**Request Body:**
```json
{
  "content": "Updated content",
  "privacyLevel": "FRIENDS"
}
```

**Response:** Updated post object

### Delete Post

```http
DELETE /api/posts/:postId
```

Delete a post (author only).

**Response:**
```json
{
  "success": true
}
```

### Like Post

```http
POST /api/posts/:postId/like
```

Like a post.

**Response:**
```json
{
  "success": true
}
```

### Unlike Post

```http
DELETE /api/posts/:postId/like
```

Remove like from a post.

**Response:**
```json
{
  "success": true
}
```

### Get Comments

```http
GET /api/posts/:postId/comments?limit={limit}&cursor={cursor}
```

Get comments for a post.

**Query Parameters:**
- `limit` (optional) - Results limit (default: 50)
- `cursor` (optional) - Pagination cursor

**Response:**
```json
{
  "comments": [
    {
      "id": "uuid",
      "content": "Comment text",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "author": {
        "id": "uuid",
        "username": "username",
        "displayName": "Display Name",
        "avatar": "https://..."
      },
      "replies": [...]
    }
  ],
  "nextCursor": "uuid"
}
```

### Add Comment

```http
POST /api/posts/:postId/comments
```

Add a comment to a post.

**Request Body:**
```json
{
  "content": "Comment text",
  "parentId": "uuid" // Optional, for replies
}
```

**Response:** Created comment object

---

## Friends

### Get Friends

```http
GET /api/friends
```

Get the authenticated user's friends list.

**Response:**
```json
[
  {
    "id": "uuid",
    "username": "username",
    "displayName": "Display Name",
    "avatar": "https://...",
    "profession": "Job Title",
    "friendshipId": "uuid",
    "friendSince": "2024-01-01T00:00:00.000Z"
  }
]
```

### Send Friend Request

```http
POST /api/friends
```

Send a friend request to a user.

**Request Body:**
```json
{
  "addresseeId": "uuid"
}
```

**Response:** Friendship object

### Get Friend Requests

```http
GET /api/friends/requests
```

Get pending friend requests.

**Response:**
```json
{
  "received": [
    {
      "id": "uuid",
      "status": "PENDING",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "requester": {
        "id": "uuid",
        "username": "username",
        "displayName": "Display Name",
        "avatar": "https://...",
        "profession": "Job Title"
      }
    }
  ],
  "sent": [...]
}
```

### Accept/Reject Friend Request

```http
PATCH /api/friends/:friendshipId
```

Accept or reject a friend request.

**Request Body:**
```json
{
  "action": "accept|reject"
}
```

**Response:** Updated friendship object

### Remove Friend

```http
DELETE /api/friends/:friendshipId
```

Remove a friend or cancel a friend request.

**Response:**
```json
{
  "success": true
}
```

---

## Follows

### Follow User

```http
POST /api/follows
```

Follow a user.

**Request Body:**
```json
{
  "followingId": "uuid"
}
```

**Response:** Follow object

### Unfollow User

```http
DELETE /api/follows/:userId
```

Unfollow a user.

**Response:**
```json
{
  "success": true
}
```

---

## Feed

### Get Feed

```http
GET /api/feed?limit={limit}&cursor={cursor}
```

Get the authenticated user's personalized feed.

**Query Parameters:**
- `limit` (optional) - Results limit (default: 20)
- `cursor` (optional) - Pagination cursor

**Response:**
```json
{
  "posts": [
    {
      "id": "uuid",
      "content": "Post content",
      "mediaUrls": [],
      "mediaType": "NONE",
      "likeCount": 10,
      "commentCount": 5,
      "hasLiked": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "author": {
        "id": "uuid",
        "username": "username",
        "displayName": "Display Name",
        "avatar": "https://..."
      }
    }
  ],
  "nextCursor": "uuid"
}
```

---

## Messages

### Get Conversations

```http
GET /api/messages/conversations
```

Get all conversations for the authenticated user.

**Response:**
```json
[
  {
    "id": "uuid",
    "otherParticipant": {
      "id": "uuid",
      "username": "username",
      "displayName": "Display Name",
      "avatar": "https://..."
    },
    "lastMessage": {
      "content": "Last message text",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "read": false,
      "senderId": "uuid"
    },
    "lastMessageAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Create Conversation

```http
POST /api/messages/conversations
```

Create or get a conversation with a user.

**Request Body:**
```json
{
  "participantId": "uuid"
}
```

**Response:** Conversation object

### Get Messages

```http
GET /api/messages/:conversationId?limit={limit}&cursor={cursor}
```

Get messages in a conversation. Automatically marks unread messages as read.

**Query Parameters:**
- `limit` (optional) - Results limit (default: 50)
- `cursor` (optional) - Pagination cursor

**Response:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "content": "Message text",
      "read": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "sender": {
        "id": "uuid",
        "username": "username",
        "displayName": "Display Name",
        "avatar": "https://..."
      }
    }
  ],
  "nextCursor": "uuid"
}
```

### Send Message

```http
POST /api/messages/:conversationId
```

Send a message in a conversation.

**Request Body:**
```json
{
  "content": "Message text"
}
```

**Response:** Created message object

---

## Notifications

### Get Notifications

```http
GET /api/notifications?limit={limit}&cursor={cursor}
```

Get notifications for the authenticated user.

**Query Parameters:**
- `limit` (optional) - Results limit (default: 20)
- `cursor` (optional) - Pagination cursor

**Response:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "FRIEND_REQUEST|FRIEND_ACCEPT|POST_LIKE|POST_COMMENT|MESSAGE|FOLLOW",
      "read": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "actor": {
        "id": "uuid",
        "username": "username",
        "displayName": "Display Name",
        "avatar": "https://..."
      },
      "postId": "uuid",
      "message": "Optional message"
    }
  ],
  "unreadCount": 5,
  "nextCursor": "uuid"
}
```

### Mark Notification as Read

```http
PATCH /api/notifications/:notificationId
```

Mark a single notification as read.

**Response:** Updated notification object

### Mark All as Read

```http
PATCH /api/notifications
```

Mark all notifications as read.

**Response:**
```json
{
  "success": true
}
```

---

## Upload

### Get Presigned Upload URL

```http
POST /api/upload/presigned
```

Get a presigned S3 URL for uploading media.

**Request Body:**
```json
{
  "fileName": "image.jpg",
  "fileType": "image/jpeg",
  "uploadType": "avatar|post"
}
```

**Response:**
```json
{
  "uploadUrl": "https://s3.../presigned-url",
  "fileUrl": "https://cloudfront.../final-url",
  "key": "posts/user-id/timestamp-random-image.jpg"
}
```

**Upload Flow:**
1. Request presigned URL from this endpoint
2. Upload file directly to S3 using `uploadUrl` (PUT request)
3. Use `fileUrl` in your post/profile update

---

## Rate Limiting

Currently, no rate limiting is implemented. For production, consider adding rate limiting middleware to prevent abuse:

- Authentication endpoints: 5 requests/minute
- Read endpoints: 100 requests/minute
- Write endpoints: 30 requests/minute
- Upload endpoints: 10 requests/minute

---

## Pagination

List endpoints support cursor-based pagination:

1. Initial request returns `nextCursor` if more results exist
2. Use `cursor` query parameter with `nextCursor` value for next page
3. Continue until `nextCursor` is null

Example:
```
GET /api/feed?limit=20
GET /api/feed?limit=20&cursor=uuid-from-previous-response
```

---

## Error Handling

### Validation Errors

```json
{
  "error": "Invalid input",
  "details": [
    {
      "path": ["content"],
      "message": "String must contain at least 1 character(s)"
    }
  ]
}
```

### Authentication Errors

```json
{
  "error": "Unauthorized"
}
```

### Permission Errors

```json
{
  "error": "Forbidden"
}
```

### Not Found Errors

```json
{
  "error": "Post not found"
}
```

---

## Webhook Support (Future)

Currently not implemented, but planned for:
- Email notifications
- Third-party integrations
- Real-time updates

---

## API Versioning

Current version: v1 (implicit)

Future versions will use URL versioning:
- `/api/v1/...`
- `/api/v2/...`

---

For questions or issues, please refer to the main README or create an issue in the repository.
