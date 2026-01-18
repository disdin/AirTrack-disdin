const mongoose = require('mongoose');

const favoriteCitySchema = new mongoose.Schema({
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
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    }
  },
  // User identifier (could be IP, session ID, or user ID in future)
  userIdentifier: {
    type: String,
    required: true,
    index: true
  },
  // Cache the last known AQI for quick access
  lastKnownAqi: {
    value: Number,
    category: String,
    dominantPollutant: String,
    lastUpdated: Date
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  // Track when this favorite was last accessed
  lastAccessed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for efficient user queries
favoriteCitySchema.index({ userIdentifier: 1, cityName: 1 }, { unique: true });

// Virtual for formatted location
favoriteCitySchema.virtual('fullLocation').get(function() {
  return `${this.cityName}, ${this.country}`;
});

// Method to update last accessed time
favoriteCitySchema.methods.updateLastAccessed = function() {
  this.lastAccessed = new Date();
  return this.save();
};

// Static method to find favorites by user
favoriteCitySchema.statics.findByUser = function(userIdentifier) {
  return this.find({ userIdentifier }).sort({ lastAccessed: -1 });
};

// Static method to clean up old favorites (older than 30 days without access)
favoriteCitySchema.statics.cleanupOldFavorites = function() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return this.deleteMany({ 
    lastAccessed: { $lt: thirtyDaysAgo } 
  });
};

// Pre-save middleware to update coordinates if needed
favoriteCitySchema.pre('save', function(next) {
  if (this.isModified('cityName') || this.isModified('country')) {
    // In a real app, you might want to geocode the city name here
    // For now, we'll rely on the frontend to provide coordinates
  }
  next();
});

module.exports = mongoose.model('FavoriteCity', favoriteCitySchema); 