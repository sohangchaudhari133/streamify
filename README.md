# 🎬 Streamify

**Streamify** is a full-featured backend video streaming platform designed to offer a seamless experience for users to upload, manage, and interact with video content. Built with **Node.js**, **Express.js**, and **MongoDB**, it supports user authentication, video uploads, comments, likes, playlists, subscriptions, and more.

This project serves as a complete backend solution with all essential functionalities that a modern streaming service backend should offer.

---

## 🚀 Features

### 👤 User Management
- **JWT Authentication**: Secure login with access and refresh tokens.
- **Password Encryption**: Hashed passwords using `bcrypt`.
- **Profile Control**: Users can manage their channel details, avatars, and cover images.

### 🎥 Video Management
- **Video Upload**: Upload videos and thumbnails to **Cloudinary**.
- **Video Metadata**: Automatically determine video duration using **FFmpeg**.
- **CRUD Operations**: Create, read, update, delete, and publish/unpublish videos.

### 💬 Comments & Likes
- **Comments**: Add, update, delete, and fetch comments on videos.
- **Likes**: Like/unlike videos, comments, and tweets.

### 📂 Playlists
- **Manage Playlists**: Create, update, delete playlists.
- **Organize Content**: Add or remove videos from playlists.

### 📺 Subscriptions
- **Subscribe/Unsubscribe**: To and from other channels.
- **Subscription Data**: Fetch subscriber lists and subscribed channels.

### 📊 Dashboard
- **Channel Insights**: View total subscribers, videos, likes, and views.
- **User Content**: Retrieve all videos uploaded by a specific user.

### 📝 Tweets
- **Tweet Management**: Create, update, delete, and view tweets.

### ❤️ Healthcheck
- **Server Status**: Dedicated endpoint to monitor API health.

---

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (Access & Refresh Tokens)
- **File Storage**: Cloudinary + Multer
- **Utilities**: FFmpeg (video duration), bcrypt (password hashing)
- **Middleware**: Custom authentication & error handling

---

## 🔐 Environment Variables

Use a `.env` file at the root to store sensitive information:

```env
PORT=
MONGODB_URI=
CORS_ORIGIN=
ACCESS_TOKEN_SECRET=
ACCESS_TOKEN_EXPIRY=
REFRESH_TOKEN_SECRET=
REFRESH_TOKEN_EXPIRY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```
## 🧰 Installation & Setup
1. Clone the repository:
```
git clone https://github.com/sohangchaudhari133/streamify.git
cd streamify
```
2. Install dependencies:
```
  npm install
```
3. Configure environment variables:

  Create a .env file in the root directory.
  Add the required variables as shown in .env_sample. 

4. Start the server:
```
  npm run start
```
## API Endpoints

  The API follows RESTful conventions. Below are some key endpoints:

**User Routes**
- POST /api/v1/users/register: Register a new user
- POST /api/v1/users/login: Login a user
- POST /api/v1/users/logout: Logout a user
  
**Video Routes**
  
- GET /api/v1/videos: Fetch all videos
- POST /api/v1/videos: Upload a new video
- PATCH /api/v1/videos/:videoId: Update video details
- DELETE /api/v1/videos/:videoId: Delete a video
  
**Comment Routes**
  
- GET /api/v1/comments/:videoId: Fetch comments for a video
- POST /api/v1/comments/:videoId: Add a comment to a video
- PATCH /api/v1/comments/c/:commentId: Update a comment
- DELETE /api/v1/comments/c/:commentId: Delete a comment
  
**Subscription Routes**
- POST /api/v1/subscription/c/:channelId: Subscribe to a channel
- GET /api/v1/subscription/c/:channelId: Fetch subscribed channels

## 🧠 Contribution
Contributions are welcome! Feel free to fork this repo and open a pull request to improve functionality or fix bugs.

## 👨‍💻 Author
**Sohang Chaudhari**

GitHub: @sohangchaudhari133
