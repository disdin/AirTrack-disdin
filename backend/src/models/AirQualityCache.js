const mongoose = require('mongoose');

const pollutantSchema = new mongoose.Schema({
  parameter: String, // pm25, pm10, no2, so2, co, o3
  value: Number,
  unit: String,
  lastUpdated: Date
}, { _id: false });

const airQualityCacheSchema = new mongoose.Schema({
  cityName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  country: {
    type: String,
    required: true,
    trim: true
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  // OpenAQ location ID for consistent data fetching
  locationId: {
    type: Number,
    index: true
  },
  // Overall AQI calculation
  aqi: {
    value: Number,
    category: String, // Good, Moderate, Unhealthy for Sensitive Groups, etc.
    dominantPollutant: String
  },
  // Individual pollutant measurements
  pollutants: [pollutantSchema],
  // Weather data from OpenWeatherMap
  weather: {
    temperature: Number,
    humidity: Number,
    windSpeed: Number,
    windDirection: Number,
    pressure: Number,
    description: String,
    icon: String
  },
  // Data source and freshness
  dataSource: {
    type: String,
    default: 'openaq'
  },
  lastFetched: {
    type: Date,
    default: Date.now,
    index: true
  },
  // TTL for automatic cleanup
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    index: { expireAfterSeconds: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for efficient city-based queries
airQualityCacheSchema.index({ cityName: 1, country: 1 }, { unique: true });

// Virtual for full location name
airQualityCacheSchema.virtual('fullLocation').get(function() {
  return `${this.cityName}, ${this.country}`;
});

// Method to check if data is fresh (less than 5 minutes old)
airQualityCacheSchema.methods.isFresh = function() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.lastFetched > fiveMinutesAgo;
};

// Static method to find fresh data for a city
airQualityCacheSchema.statics.findFreshData = function(cityName, country) {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.findOne({ 
    cityName: new RegExp(cityName, 'i'), 
    country: new RegExp(country, 'i'),
    lastFetched: { $gt: fiveMinutesAgo }
  });
};

// Static method to update or create cache entry
airQualityCacheSchema.statics.upsertCityData = async function(cityData) {
  const filter = { 
    cityName: cityData.cityName, 
    country: cityData.country 
  };
  
  const update = {
    ...cityData,
    lastFetched: new Date(),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000)
  };
  
  return this.findOneAndUpdate(filter, update, { 
    upsert: true, 
    new: true,
    runValidators: true 
  });
};

// Method to get pollutant by parameter name
airQualityCacheSchema.methods.getPollutant = function(parameter) {
  return this.pollutants.find(p => p.parameter === parameter);
};

// Method to get AQI color based on value
airQualityCacheSchema.methods.getAqiColor = function() {
  if (!this.aqi || !this.aqi.value) return '#9CA3AF'; // gray for unknown
  
  const aqi = this.aqi.value;
  if (aqi <= 50) return '#10B981'; // green
  if (aqi <= 100) return '#F59E0B'; // yellow
  if (aqi <= 150) return '#F97316'; // orange
  if (aqi <= 200) return '#EF4444'; // red
  if (aqi <= 300) return '#8B5CF6'; // purple
  return '#7C2D12'; // maroon for hazardous
};

module.exports = mongoose.model('AirQualityCache', airQualityCacheSchema); 