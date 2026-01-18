# AirTrack - Real-Time Air Quality Monitoring

AirTrack is a full-stack web application that provides real-time air quality monitoring with interactive maps, detailed analytics, and historical data tracking. Built with modern technologies for optimal performance and user experience.

## 🌟 Features

- **Real-time Air Quality Data**: Live AQI monitoring from OpenAQ API
- **Interactive Map**: Leaflet-powered map with color-coded air quality markers
- **Historical Analytics**: 7-day historical data with interactive charts
- **Weather Integration**: Current weather data from OpenWeatherMap
- **Favorites System**: Save and track your favorite cities
- **Responsive Design**: Mobile-first design with dark/light mode
- **Smart Caching**: MongoDB-powered caching for optimal performance
- **Search & Discovery**: Advanced city search with relevance ranking

## 🏗️ Project Structure

```
airtrack/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── config/         # Database and environment configuration
│   │   ├── controllers/    # Request handlers and business logic
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # External API integrations
│   │   ├── models/         # MongoDB schemas and models
│   │   ├── utils/          # Helper functions and utilities
│   │   └── app.js          # Express application entry point
│   ├── package.json
│   └── env.example
├── frontend/               # Next.js + React frontend
│   ├── app/                # Next.js App Router pages
│   ├── components/         # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # API clients and utilities
│   ├── public/             # Static assets
│   ├── package.json
│   └── env.example
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB Atlas account (or local MongoDB)
- OpenWeatherMap API key (optional, for weather data)
- Git

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/airtrack.git
cd airtrack

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration

**IMPORTANT:** Create environment files from the examples:

```bash
# Copy environment file templates
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

#### Backend Environment (backend/.env)

Edit `backend/.env` with your actual values:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/airtrack?retryWrites=true&w=majority

# External APIs
OPENAQ_BASE_URL=https://api.openaq.org/v2
OPENWEATHER_API_KEY=your_openweather_api_key_here
OPENWEATHER_BASE_URL=https://api.openweathermap.org/data/2.5

# CORS Settings
FRONTEND_URL=http://localhost:3000

# Cache Settings
CACHE_TTL=300
API_RATE_LIMIT_WINDOW=900000
API_RATE_LIMIT_MAX_REQUESTS=100
```

#### Frontend Environment (frontend/.env.local)

Edit `frontend/.env.local` with your actual values:

```env
# Backend API
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api

# Application Configuration
NEXT_PUBLIC_APP_NAME=AirTrack
NEXT_PUBLIC_APP_VERSION=1.0.0

# Map Configuration
NEXT_PUBLIC_DEFAULT_MAP_CENTER_LAT=40.7128
NEXT_PUBLIC_DEFAULT_MAP_CENTER_LNG=-74.0060
NEXT_PUBLIC_DEFAULT_MAP_ZOOM=10

# Feature Flags
NEXT_PUBLIC_ENABLE_DARK_MODE=true
NEXT_PUBLIC_ENABLE_FAVORITES=true
NEXT_PUBLIC_ENABLE_WEATHER=true
```

### 3. Database Setup

1. Create a MongoDB Atlas cluster or use local MongoDB
2. Create a database named `airtrack`
3. Update the `MONGODB_URI` in backend/.env

### 4. API Keys

1. **OpenWeatherMap (Optional)**:
   - Sign up at [OpenWeatherMap](https://openweathermap.org/api)
   - Get your free API key
   - Add to `OPENWEATHER_API_KEY` in backend/.env

2. **OpenAQ**: No API key required (free tier)

### 5. Start Development Servers

#### Option A: Separate Terminals

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

#### Option B: Concurrent (requires concurrently package)

```bash
# Install concurrently globally
npm install -g concurrently

# From project root
concurrently "cd backend && npm run dev" "cd frontend && npm run dev"
```

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000 (lists all endpoints)
- **Health Check**: http://localhost:5000/health

## 📚 API Documentation

### Air Quality Endpoints

- `GET /api/airquality/:city?country=US` - Current air quality for a city
- `GET /api/airquality/history/:city?country=US&days=7` - Historical data
- `POST /api/airquality/batch` - Batch air quality data for multiple cities
- `GET /api/airquality/search?q=london&limit=10` - Search cities
- `GET /api/airquality/health` - Service health check

### Cities & Favorites

- `GET /api/cities?limit=50&search=london` - Available cities
- `GET /api/favorites` - User's favorite cities
- `POST /api/favorites` - Add city to favorites
- `DELETE /api/favorites/:id` - Remove favorite
- `PUT /api/favorites/refresh` - Refresh all favorites

### Example API Response

```json
{
  "success": true,
  "data": {
    "cityName": "London",
    "country": "GB",
    "coordinates": {
      "latitude": 51.5074,
      "longitude": -0.1278
    },
    "aqi": {
      "value": 42,
      "category": "Good",
      "dominantPollutant": "pm25"
    },
    "pollutants": [
      {
        "parameter": "pm25",
        "value": 12.5,
        "unit": "µg/m³",
        "lastUpdated": "2023-12-07T10:30:00Z"
      }
    ],
    "weather": {
      "temperature": 8,
      "humidity": 76,
      "description": "light rain"
    }
  },
  "source": "fresh"
}
```

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Caching**: Node-cache + MongoDB TTL indexes
- **External APIs**: OpenAQ, OpenWeatherMap
- **Security**: Helmet, CORS, Rate limiting
- **Development**: Nodemon, ESLint

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Maps**: Leaflet + React-Leaflet
- **Charts**: Recharts
- **Data Fetching**: SWR + Axios
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **TypeScript**: Full type safety

## 🎨 Key Features Details

### Air Quality Index (AQI) Calculation
- EPA standard AQI calculation for PM2.5, PM10, O3, NO2, SO2, CO
- Color-coded categories: Good (Green) → Hazardous (Maroon)
- Real-time dominant pollutant identification

### Interactive Map
- Color-coded markers based on AQI levels
- Hover effects and detailed popups
- Responsive zoom and pan controls
- Default center on major cities

### Smart Caching Strategy
- **In-memory cache**: 5-minute TTL for frequently accessed data
- **Database cache**: MongoDB with automatic expiration
- **Client cache**: SWR for optimal user experience
- **Rate limiting**: Prevents API abuse

### Responsive Design
- Mobile-first approach
- Dark/light mode toggle
- Accessible design patterns
- Touch-friendly interface

## 🚀 Deployment

### Backend Deployment (Render/Heroku)

1. **Render**:
   ```bash
   # Connect your GitHub repo to Render
   # Set environment variables in Render dashboard
   # Deploy automatically on git push
   ```

2. **Environment Variables for Production**:
   - `NODE_ENV=production`
   - `MONGODB_URI=<your-mongodb-atlas-connection>`
   - `OPENWEATHER_API_KEY=<your-api-key>`
   - `FRONTEND_URL=<your-frontend-url>`

### Frontend Deployment (Vercel/Netlify)

1. **Vercel**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy from frontend directory
   cd frontend
   vercel
   ```

2. **Environment Variables for Production**:
   - `NEXT_PUBLIC_API_BASE_URL=<your-backend-url>/api`

### Database (MongoDB Atlas)
1. Create cluster and database
2. Whitelist deployment IPs
3. Create database user
4. Update connection string

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm run test
```

### API Testing
```bash
# Test health endpoint
curl http://localhost:5000/health

# Test air quality endpoint
curl "http://localhost:5000/api/airquality/London?country=GB"
```

## 📈 Performance Optimization

- **Caching**: Multi-layer caching strategy
- **Database Indexing**: Optimized MongoDB indexes
- **Image Optimization**: Next.js automatic optimization
- **Code Splitting**: Automatic by Next.js
- **API Rate Limiting**: Prevents overload
- **Compression**: Gzip compression enabled

## 🔒 Security Features

- **Helmet**: Security headers
- **CORS**: Configured origins
- **Rate Limiting**: API protection
- **Input Validation**: Data sanitization
- **Environment Variables**: Secure configuration
- **MongoDB Injection**: Protection via Mongoose

## 🐳 Docker Deployment (Alternative)

If you prefer using Docker:

```bash
# 1. Create and configure .env file
cp .env.example .env
# Edit .env with your MongoDB credentials and API keys

# 2. Build and start all services
docker-compose up -d

# 3. View logs
docker-compose logs -f

# 4. Stop services
docker-compose down
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- MongoDB: localhost:27017

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Write meaningful commit messages
- Update documentation for new features
- Test your changes before submitting PR
- Never commit `.env` files or sensitive credentials

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenAQ](https://openaq.org/) for free air quality data
- [OpenWeatherMap](https://openweathermap.org/) for weather data
- [Leaflet](https://leafletjs.com/) for mapping capabilities
- [EPA](https://www.epa.gov/) for AQI calculation standards

## 📞 Support

For support, email support@airtrack.com or create an issue in this repository.

---

**Built with ❤️ for cleaner air and better health monitoring**