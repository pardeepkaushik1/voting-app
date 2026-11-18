# Online Voting System

A full-stack Online Voting System built to provide a secure, user-friendly, and transparent digital voting experience.

The application allows users to register, verify their email, explore candidates, cast their votes, and manage their profiles. Administrators can manage elections, candidates, and other voting-related activities.

## Features

### User Features
- User Registration and Login
- JWT-based Authentication
- Email Verification
- Forgot and Change Password
- User Profile Management
- Profile Image Upload
- View Candidates and Elections
- Cast Vote
- Voting History
- Submit Complaints
- AI-powered Chatbot
- Multi-language Support
- Light and Dark Theme

### Admin Features
- Admin Dashboard
- Manage Candidates
- Manage Elections
- Manage Candidate and Party Images
- Manage User Complaints
- View Voting Statistics and Results

## Tech Stack

### Frontend
- React.js
- Tailwind CSS
- JavaScript
- Axios
- React Router
- Recharts

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Bcrypt.js
- Cloudinary
- Nodemailer
- Groq AI API

## Project Structure

```text
voting-app/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
│
├── backend/
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── server.js
│
├── .gitignore
└── README.md
```

## Installation and Setup

### 1. Clone the Repository

```bash
git clone YOUR_REPOSITORY_URL
cd voting-app
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file inside the backend folder and configure the required environment variables.

Example:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

GROQ_API_KEY=your_groq_api_key
```

Add your email configuration variables as required by the mailer setup.

Start the backend:

```bash
npm run dev
```

### 3. Setup Frontend

Open another terminal:

```bash
cd frontend
npm install
```

Create a `.env` file inside the frontend folder:

```env
VITE_API_BASE_URL=your_backend_api_url
```

Start the frontend:

```bash
npm run dev
```

## Environment Variables

Make sure to configure all required environment variables before running the application.

Never commit your actual API keys, database credentials, email passwords, or JWT secrets to GitHub.

## Future Improvements

- Additional security enhancements
- Improved performance and scalability
- More advanced election analytics
- Further UI/UX improvements

## Author

**Pardeep Sharma**

Full Stack Developer

