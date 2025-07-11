# Syncender

A MERN stack application that allows users to track sports events and integrate them with their Google Calendar and Apple Calendar.

## Features

- User authentication (Register/Login)
- Sports event tracking
- Google Calendar integration
- Apple Calendar integration (coming soon)
- Event management
- Team/Sport preferences

## Tech Stack

- **Frontend**: React (coming soon)
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Authentication**: JWT
- **APIs**: Google Calendar API, Sports API (to be integrated)

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Google Cloud Platform account (for Google Calendar API)
- Sports API account (to be determined)

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/UtkarshNigam11/Syncender/
cd syncender
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Create a `.env` file in the backend directory with the following variables:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/sports-calendar
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=24h

# Google Calendar API
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
GOOGLE_REFRESH_TOKEN=your_google_refresh_token
```

4. Start the backend server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/google/callback` - Google OAuth callback

### Events
- `GET /api/events` - Get all events for authenticated user
- `POST /api/events` - Create a new event
- `GET /api/events/:id` - Get a specific event
- `PUT /api/events/:id` - Update an event
- `DELETE /api/events/:id` - Delete an event

### Sports
- `GET /api/sports/sports` - Get available sports
- `GET /api/sports/matches/:sportId` - Get matches for a sport
- `GET /api/sports/teams/:sportId` - Get teams for a sport
- `GET /api/sports/matches/:sportId/:matchId` - Get match details

## Development Status

### Backend
- [x] Basic server setup
- [x] Database models
- [x] Authentication system
- [x] Event management
- [x] Route protection
- [ ] Google Calendar integration (in progress)
- [ ] Sports API integration
- [ ] Apple Calendar integration
- [ ] Testing

### Frontend
- [x] Project setup
- [ ] Authentication
- [ ] Event management
- [ ] Calendar integration
- [ ] Sports data display

## Contributing

1. Create a new branch for your feature:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and commit them:
```bash
git commit -m "Add your feature description"
```

3. Push to your branch:
```bash
git push origin feature/your-feature-name
```

4. Create a Pull Request

## Environment Variables

Make sure to set up all required environment variables in your `.env` file. Never commit the `.env` file to version control.

## License

This project is licensed under the MIT License. 
