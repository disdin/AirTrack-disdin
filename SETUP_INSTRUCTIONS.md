# AirTrack Local Setup Instructions

## Step 1: Environment Configuration

### Backend Environment Setup
1. Copy the environment template:
```bash
cp backend/.env.example backend/.env
```

2. Edit `backend/.env` and update these values:
```env
# Required: MongoDB connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/airtrack?retryWrites=true&w=majority

# Optional: OpenWeatherMap API key (for weather data)
OPENWEATHER_API_KEY=your_api_key_here

# Keep these as default for local development
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend Environment Setup
1. Copy the environment template:
```bash
cp frontend/.env.example frontend/.env.local
```

2. Edit `frontend/.env.local` and update:
```env
# Backend API URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api

# Keep other values as default
NEXT_PUBLIC_APP_NAME=AirTrack
NEXT_PUBLIC_ENABLE_DARK_MODE=true
NEXT_PUBLIC_ENABLE_FAVORITES=true
NEXT_PUBLIC_ENABLE_WEATHER=true
```

## Step 2: Install Dependencies

### Backend Dependencies
```bash
cd backend
npm install
```

### Frontend Dependencies
```bash
cd ../frontend
npm install
```

## Step 3: Start Development Servers

### Option A: Start Both Servers Separately

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

### Option B: Using Docker Compose (if Docker is installed)
```bash
# From project root
docker-compose up -d
```

## Step 4: Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/health

## Step 5: Get API Keys (Optional but Recommended)

### MongoDB Atlas (Required)
1. Go to https://www.mongodb.com/atlas
2. Create a free account
3. Create a new cluster
4. Get your connection string
5. Update `MONGODB_URI` in `backend/.env`

### OpenWeatherMap (Optional - for weather data)
1. Go to https://openweathermap.org/api
2. Sign up for a free account
3. Get your API key
4. Update `OPENWEATHER_API_KEY` in `backend/.env`

## Troubleshooting

### Port Already in Use
```bash
# Kill processes on ports 3000 or 5000
sudo lsof -ti:3000 | xargs kill -9
sudo lsof -ti:5000 | xargs kill -9
```

### MongoDB Connection Issues
- Check your MongoDB Atlas IP whitelist
- Verify your connection string format
- Ensure your MongoDB user has proper permissions

### Missing Dependencies
```bash
# Clean install backend
cd backend && rm -rf node_modules package-lock.json && npm install

# Clean install frontend
cd frontend && rm -rf node_modules package-lock.json && npm install
```

## Production Deployment

### Backend (Render/Heroku)
1. Connect your GitHub repo
2. Set environment variables in the platform dashboard
3. Deploy automatically

### Frontend (Vercel/Netlify)
1. Connect your GitHub repo
2. Set `NEXT_PUBLIC_API_BASE_URL` to your backend URL
3. Deploy automatically

### Database (MongoDB Atlas)
1. Whitelist deployment server IPs
2. Update connection string for production

## Features Available

✅ Real-time air quality data from OpenAQ
✅ Interactive Leaflet maps with AQI markers
✅ Historical data charts (7-day trends)
✅ Weather integration (with API key)
✅ City search with autocomplete
✅ Favorites system
✅ Dark/light mode toggle
✅ Responsive mobile design
✅ Type-safe TypeScript
✅ Production-ready caching
✅ Error handling and boundaries

## Support

- Check the main README.md for detailed documentation
- All API endpoints are documented in the backend code
- Components are fully typed with TypeScript
- Error messages will guide you through any issues
