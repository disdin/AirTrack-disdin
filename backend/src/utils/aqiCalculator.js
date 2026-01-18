/**
 * AQI Calculator - Converts pollutant concentrations to Air Quality Index
 * Based on US EPA AQI standards
 */

class AQICalculator {
  constructor() {
    // AQI breakpoints for different pollutants (US EPA standard)
    this.breakpoints = {
      pm25: [
        { cLow: 0, cHigh: 12, aqiLow: 0, aqiHigh: 50 },
        { cLow: 12.1, cHigh: 35.4, aqiLow: 51, aqiHigh: 100 },
        { cLow: 35.5, cHigh: 55.4, aqiLow: 101, aqiHigh: 150 },
        { cLow: 55.5, cHigh: 150.4, aqiLow: 151, aqiHigh: 200 },
        { cLow: 150.5, cHigh: 250.4, aqiLow: 201, aqiHigh: 300 },
        { cLow: 250.5, cHigh: 500.4, aqiLow: 301, aqiHigh: 500 }
      ],
      pm10: [
        { cLow: 0, cHigh: 54, aqiLow: 0, aqiHigh: 50 },
        { cLow: 55, cHigh: 154, aqiLow: 51, aqiHigh: 100 },
        { cLow: 155, cHigh: 254, aqiLow: 101, aqiHigh: 150 },
        { cLow: 255, cHigh: 354, aqiLow: 151, aqiHigh: 200 },
        { cLow: 355, cHigh: 424, aqiLow: 201, aqiHigh: 300 },
        { cLow: 425, cHigh: 604, aqiLow: 301, aqiHigh: 500 }
      ],
      o3: [
        { cLow: 0, cHigh: 54, aqiLow: 0, aqiHigh: 50 },
        { cLow: 55, cHigh: 70, aqiLow: 51, aqiHigh: 100 },
        { cLow: 71, cHigh: 85, aqiLow: 101, aqiHigh: 150 },
        { cLow: 86, cHigh: 105, aqiLow: 151, aqiHigh: 200 },
        { cLow: 106, cHigh: 200, aqiLow: 201, aqiHigh: 300 }
      ],
      no2: [
        { cLow: 0, cHigh: 53, aqiLow: 0, aqiHigh: 50 },
        { cLow: 54, cHigh: 100, aqiLow: 51, aqiHigh: 100 },
        { cLow: 101, cHigh: 360, aqiLow: 101, aqiHigh: 150 },
        { cLow: 361, cHigh: 649, aqiLow: 151, aqiHigh: 200 },
        { cLow: 650, cHigh: 1249, aqiLow: 201, aqiHigh: 300 },
        { cLow: 1250, cHigh: 2049, aqiLow: 301, aqiHigh: 500 }
      ],
      so2: [
        { cLow: 0, cHigh: 35, aqiLow: 0, aqiHigh: 50 },
        { cLow: 36, cHigh: 75, aqiLow: 51, aqiHigh: 100 },
        { cLow: 76, cHigh: 185, aqiLow: 101, aqiHigh: 150 },
        { cLow: 186, cHigh: 304, aqiLow: 151, aqiHigh: 200 },
        { cLow: 305, cHigh: 604, aqiLow: 201, aqiHigh: 300 },
        { cLow: 605, cHigh: 1004, aqiLow: 301, aqiHigh: 500 }
      ],
      co: [
        { cLow: 0, cHigh: 4.4, aqiLow: 0, aqiHigh: 50 },
        { cLow: 4.5, cHigh: 9.4, aqiLow: 51, aqiHigh: 100 },
        { cLow: 9.5, cHigh: 12.4, aqiLow: 101, aqiHigh: 150 },
        { cLow: 12.5, cHigh: 15.4, aqiLow: 151, aqiHigh: 200 },
        { cLow: 15.5, cHigh: 30.4, aqiLow: 201, aqiHigh: 300 },
        { cLow: 30.5, cHigh: 50.4, aqiLow: 301, aqiHigh: 500 }
      ]
    };

    this.categories = [
      { min: 0, max: 50, name: 'Good', description: 'Air quality is satisfactory' },
      { min: 51, max: 100, name: 'Moderate', description: 'Air quality is acceptable' },
      { min: 101, max: 150, name: 'Unhealthy for Sensitive Groups', description: 'Members of sensitive groups may experience health effects' },
      { min: 151, max: 200, name: 'Unhealthy', description: 'Everyone may begin to experience health effects' },
      { min: 201, max: 300, name: 'Very Unhealthy', description: 'Health warnings of emergency conditions' },
      { min: 301, max: 500, name: 'Hazardous', description: 'Health alert: everyone may experience more serious health effects' }
    ];
  }

  /**
   * Calculate AQI for a specific pollutant
   */
  calculatePollutantAQI(pollutant, concentration) {
    const breakpoints = this.breakpoints[pollutant];
    if (!breakpoints) {
      console.warn(`No AQI breakpoints defined for pollutant: ${pollutant}`);
      return null;
    }

    // Find the appropriate breakpoint
    for (const bp of breakpoints) {
      if (concentration >= bp.cLow && concentration <= bp.cHigh) {
        // Linear interpolation formula: I = ((IHi - ILo) / (CHi - CLo)) * (C - CLo) + ILo
        const aqi = Math.round(
          ((bp.aqiHigh - bp.aqiLow) / (bp.cHigh - bp.cLow)) * 
          (concentration - bp.cLow) + bp.aqiLow
        );
        return Math.max(0, Math.min(500, aqi)); // Clamp between 0-500
      }
    }

    // If concentration is above the highest breakpoint, return max AQI
    return 500;
  }

  /**
   * Calculate overall AQI from multiple pollutants
   */
  calculateOverallAQI(pollutants) {
    if (!pollutants || pollutants.length === 0) {
      return { value: null, category: 'Unknown', dominantPollutant: null };
    }

    let maxAQI = 0;
    let dominantPollutant = null;

    // Calculate AQI for each pollutant and find the maximum
    for (const pollutant of pollutants) {
      if (!pollutant.value || pollutant.value <= 0) continue;

      const aqi = this.calculatePollutantAQI(pollutant.parameter, pollutant.value);
      if (aqi && aqi > maxAQI) {
        maxAQI = aqi;
        dominantPollutant = pollutant.parameter;
      }
    }

    return {
      value: maxAQI > 0 ? maxAQI : null,
      category: this.getAQICategory(maxAQI),
      dominantPollutant
    };
  }

  /**
   * Get AQI category name and description
   */
  getAQICategory(aqi) {
    if (!aqi || aqi <= 0) return 'Unknown';

    const category = this.categories.find(cat => aqi >= cat.min && aqi <= cat.max);
    return category ? category.name : 'Unknown';
  }

  /**
   * Get AQI category with full details
   */
  getAQICategoryDetails(aqi) {
    if (!aqi || aqi <= 0) {
      return { 
        name: 'Unknown', 
        description: 'No data available',
        color: '#9CA3AF'
      };
    }

    const category = this.categories.find(cat => aqi >= cat.min && aqi <= cat.max);
    if (!category) {
      return { 
        name: 'Unknown', 
        description: 'Invalid AQI value',
        color: '#9CA3AF'
      };
    }

    // Add color coding
    const colors = {
      'Good': '#10B981',
      'Moderate': '#F59E0B',
      'Unhealthy for Sensitive Groups': '#F97316',
      'Unhealthy': '#EF4444',
      'Very Unhealthy': '#8B5CF6',
      'Hazardous': '#7C2D12'
    };

    return {
      ...category,
      color: colors[category.name] || '#9CA3AF'
    };
  }

  /**
   * Process raw OpenAQ data into standardized format
   */
  processOpenAQData(measurements) {
    if (!measurements || measurements.length === 0) {
      return [];
    }

    const processedPollutants = measurements
      .filter(m => m.value !== null && m.value !== undefined)
      .map(measurement => ({
        parameter: measurement.parameter?.name || measurement.parameter,
        value: measurement.value,
        unit: measurement.parameter?.units || measurement.unit,
        lastUpdated: new Date(measurement.datetime?.utc || measurement.datetime || measurement.date?.utc || measurement.lastUpdated)
      }));

    return processedPollutants;
  }

  /**
   * Get health recommendations based on AQI
   */
  getHealthRecommendations(aqi) {
    if (!aqi || aqi <= 0) return [];

    if (aqi <= 50) {
      return ['Air quality is good. Enjoy outdoor activities!'];
    } else if (aqi <= 100) {
      return [
        'Air quality is acceptable for most people.',
        'Sensitive individuals should consider limiting prolonged outdoor exertion.'
      ];
    } else if (aqi <= 150) {
      return [
        'Sensitive groups should reduce outdoor activities.',
        'Everyone else can continue normal outdoor activities.'
      ];
    } else if (aqi <= 200) {
      return [
        'Everyone should reduce prolonged or heavy outdoor exertion.',
        'Sensitive groups should avoid outdoor activities.'
      ];
    } else if (aqi <= 300) {
      return [
        'Everyone should avoid prolonged or heavy outdoor exertion.',
        'Sensitive groups should remain indoors.'
      ];
    } else {
      return [
        'Everyone should avoid all outdoor activities.',
        'Remain indoors and keep windows closed.'
      ];
    }
  }
}

module.exports = new AQICalculator(); 