// MongoDB initialization script for AirTrack
// This script creates the necessary collections and indexes

// Switch to airtrack database
db = db.getSiblingDB('airtrack');

// Create collections
db.createCollection('favoritecities');
db.createCollection('airqualitycaches');

// Create indexes for better performance
// FavoriteCity collection indexes
db.favoritecities.createIndex({ 'userIdentifier': 1 });
db.favoritecities.createIndex({ 'cityName': 1, 'country': 1 });
db.favoritecities.createIndex({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });
db.favoritecities.createIndex({ 'userIdentifier': 1, 'cityName': 1, 'country': 1 }, { unique: true });

// AirQualityCache collection indexes
db.airqualitycaches.createIndex({ 'cityName': 1, 'country': 1 });
db.airqualitycaches.createIndex({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });
db.airqualitycaches.createIndex({ 'locationId': 1 });
db.airqualitycaches.createIndex({ 'expiresAt': 1 }, { expireAfterSeconds: 0 }); // TTL index
db.airqualitycaches.createIndex({ 'lastFetched': 1 });

// Create a compound index for efficient location-based queries
db.airqualitycaches.createIndex({ 
  'cityName': 1, 
  'country': 1, 
  'lastFetched': -1 
});

// Create text index for city search
db.airqualitycaches.createIndex({
  'cityName': 'text',
  'country': 'text'
}, {
  name: 'city_search_text',
  weights: {
    'cityName': 10,
    'country': 5
  }
});

print('✅ AirTrack database initialized successfully');
print('📊 Collections created: favoritecities, airqualitycaches');
print('🔍 Indexes created for optimal performance');
print('⏰ TTL index configured for automatic cache cleanup'); 