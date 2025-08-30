// WeatherAPI integration
const WEATHER_API_KEY = '128d6be413744cad8d6134353253008';
const BASE_URL = 'https://api.weatherapi.com/v1';

class WeatherAPI {
    constructor() {
        this.apiKey = WEATHER_API_KEY;
        this.baseUrl = BASE_URL;
    }

    // Get current weather and forecast for a city
    async getWeatherData(city) {
        try {
            const response = await fetch(
                `${this.baseUrl}/forecast.json?key=${this.apiKey}&q=${encodeURIComponent(city)}&days=7&aqi=no`
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Weather API Response:', data); // API connection test
            return data;
        } catch (error) {
            console.error('Error fetching weather data:', error);
            throw error;
        }
    }

    // Get current weather only
    async getCurrentWeather(city) {
        try {
            const response = await fetch(
                `${this.baseUrl}/current.json?key=${this.apiKey}&q=${encodeURIComponent(city)}&aqi=no`
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching current weather:', error);
            throw error;
        }
    }

    // Format temperature (convert from Celsius to Fahrenheit if needed)
    formatTemperature(tempC, unit = 'C') {
        if (unit === 'F') {
            return `${Math.round((tempC * 9 / 5) + 32)}°F`;
        }
        return `${Math.round(tempC)}°C`;
    }

    // Format time
    formatTime(timeString) {
        const date = new Date(timeString);
        const options = {
            weekday: 'long',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        };
        return date.toLocaleDateString('en-US', options);
    }

    // Get day name from date
    getDayName(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    }

    // Get weather icon URL
    getWeatherIcon(conditionCode, isDay = true) {
        // WeatherAPI provides icon URLs, but we can also use condition codes
        // For now, returning a placeholder - you can replace with actual icon URLs
        return `https://cdn.weatherapi.com/weather/64x64/${isDay ? 'day' : 'night'}/${conditionCode}.png`;
    }

    // Get city suggestions/autocomplete
    async getCitySuggestions(query) {
        try {
            if (query.length < 2) return [];

            const response = await fetch(
                `${this.baseUrl}/search.json?key=${this.apiKey}&q=${encodeURIComponent(query)}`
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.slice(0, 5); // Limit to 5 suggestions
        } catch (error) {
            console.error('Error fetching city suggestions:', error);
            return [];
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeatherAPI;
}
