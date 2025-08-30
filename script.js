// Weather App Main Script
class WeatherApp {
    constructor() {
        this.weatherAPI = new WeatherAPI();
        this.currentCity = '';
        this.searchHistory = [];
        this.init();
    }

    // ========================================
    // INITIALIZATION METHODS
    // ========================================

    init() {
        this.loadSearchHistory();
        this.setupEventListeners();
        this.setupSearchHistory();
        this.setupClickOutsideHandler();

        // Load default city (London) on app start
        this.searchCity('London');
    }

    // ========================================
    // EVENT LISTENERS SETUP
    // ========================================

    setupEventListeners() {
        const cityInput = document.getElementById('city');
        const cityFieldWrapper = document.querySelector('.city-field-wrapper');
        const suggestionsContainer = document.getElementById('city-suggestions');

        if (cityInput && cityFieldWrapper) {
            // Input focus/blur effects
            cityInput.addEventListener('focus', () => {
                cityFieldWrapper.classList.add('focus');
            });

            cityInput.addEventListener('blur', () => {
                // Delay hiding suggestions to allow clicking on them
                setTimeout(() => {
                    cityFieldWrapper.classList.remove('focus');
                    this.hideSuggestions();
                }, 200);
            });

            // Search on Enter key
            cityInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const cityName = cityInput.value.trim();
                    if (cityName) {
                        this.searchCity(cityName);
                        cityInput.value = '';
                        this.hideSuggestions();
                    }
                }
            });

            // Input change for suggestions
            cityInput.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                if (query.length >= 2) {
                    this.showCitySuggestions(query);
                } else {
                    this.hideSuggestions();
                }
            });

            // Prevent suggestions from hiding when clicking inside
            suggestionsContainer?.addEventListener('mousedown', (e) => {
                e.preventDefault();
            });
        }
    }

    setupClickOutsideHandler() {
        document.addEventListener('click', (e) => {
            const cityFieldWrapper = document.querySelector('.city-field-wrapper');
            const suggestionsContainer = document.getElementById('city-suggestions');

            if (!cityFieldWrapper?.contains(e.target) &&
                suggestionsContainer?.classList.contains('show')) {
                this.hideSuggestions();
            }
        });
    }

    // ========================================
    // SEARCH HISTORY MANAGEMENT
    // ========================================

    setupSearchHistory() {
        const locationHistory = document.querySelector('.location-history');
        if (locationHistory) {
            // Clear static content
            locationHistory.innerHTML = '';
            this.renderSearchHistory();
        }
    }

    addToSearchHistory(cityName) {
        // Remove if already exists
        this.searchHistory = this.searchHistory.filter(city => city !== cityName);

        // Add to beginning
        this.searchHistory.unshift(cityName);

        // Keep only last 5 searches
        if (this.searchHistory.length > 5) {
            this.searchHistory = this.searchHistory.slice(0, 5);
        }

        // Save to sessionStorage
        this.saveSearchHistory();

        // Update UI
        this.renderSearchHistory();
    }

    renderSearchHistory() {
        const locationHistory = document.querySelector('.location-history');
        if (!locationHistory) return;

        locationHistory.innerHTML = '';

        this.searchHistory.forEach((city, index) => {
            const cityLocation = document.createElement('div');
            cityLocation.className = 'city-location';

            if (city === this.currentCity) {
                cityLocation.classList.add('active');
            }

            cityLocation.innerHTML = `
                <div class="icon">
                    <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                        <path d="M128,16a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,120a32,32,0,1,1,32-32A32,32,0,0,1,128,136Z"></path>
                    </svg>
                </div>
                <div class="city-info">
                    <p class="city-name">${city}</p>
                    <p class="weather">Click to view</p>
                </div>
            `;

            // Add click event to history item
            cityLocation.addEventListener('click', () => {
                this.searchCity(city);

                // Update active state
                document.querySelectorAll('.city-location').forEach(el => {
                    el.classList.remove('active');
                });
                cityLocation.classList.add('active');
            });

            locationHistory.appendChild(cityLocation);
        });
    }

    saveSearchHistory() {
        try {
            sessionStorage.setItem('weatherSearchHistory', JSON.stringify(this.searchHistory));
        } catch (error) {
            console.error('Error saving search history:', error);
        }
    }

    loadSearchHistory() {
        try {
            const saved = sessionStorage.getItem('weatherSearchHistory');
            if (saved) {
                this.searchHistory = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading search history:', error);
            this.searchHistory = [];
        }
    }

    // ========================================
    // WEATHER DATA FETCHING
    // ========================================

    async searchCity(cityName) {
        try {
            console.log(`Searching for city: ${cityName}`);

            // Show loading state
            this.showLoading(true);

            // Fetch weather data
            const weatherData = await this.weatherAPI.getWeatherData(cityName);

            // Update current city
            this.currentCity = cityName;

            // Add to search history
            this.addToSearchHistory(cityName);

            // Update UI with weather data
            this.updateWeatherDisplay(weatherData);

            // Hide loading state
            this.showLoading(false);

        } catch (error) {
            console.error('Error searching city:', error);
            this.showLoading(false);
            this.showError(`Error fetching weather for ${cityName}`);
        }
    }

    // ========================================
    // UI UPDATE METHODS
    // ========================================

    updateWeatherDisplay(weatherData) {
        if (!weatherData || !weatherData.current || !weatherData.forecast) {
            console.error('Invalid weather data received');
            return;
        }

        const current = weatherData.current;
        const location = weatherData.location;
        const forecast = weatherData.forecast.forecastday;

        // Update main weather section
        this.updateMainWeather(location, current);

        // Update 7-day forecast
        this.updateForecast(forecast);

        // Update extra information
        this.updateExtraInfo(current);
    }

    updateMainWeather(location, current) {
        // Update city name and time
        const cityNameElements = document.querySelectorAll('#city-name');
        cityNameElements.forEach(el => {
            el.textContent = location.name;
        });

        const timeElement = document.querySelector('.time');
        if (timeElement) {
            timeElement.textContent = this.weatherAPI.formatTime(location.localtime);
        }

        // Update temperature and condition
        const tempElement = document.querySelector('.temprature h2');
        if (tempElement) {
            tempElement.textContent = this.weatherAPI.formatTemperature(current.temp_c);
        }

        const conditionElement = document.querySelector('.temprature p');
        if (conditionElement) {
            conditionElement.textContent = current.condition.text;
        }
    }

    updateForecast(forecast) {
        const forecastWrapper = document.querySelector('.forecast-wrapper');
        if (!forecastWrapper) return;

        forecastWrapper.innerHTML = '';

        forecast.forEach((day, index) => {
            const dayElement = document.createElement('div');
            dayElement.className = `day day-${index + 1}`;

            dayElement.innerHTML = `
                <p class="day-name">${this.weatherAPI.getDayName(day.date)}</p>
                <div class="weather-icon">
                    <img src="${day.day.condition.icon}" alt="${day.day.condition.text}" class="weather-icon-img">
                </div>
                <p class="temp-range">
                    <span class="max-temp">${this.weatherAPI.formatTemperature(day.day.maxtemp_c)}</span>/
                    <span class="min-temp">${this.weatherAPI.formatTemperature(day.day.mintemp_c)}</span>
                </p>
            `;

            forecastWrapper.appendChild(dayElement);
        });
    }

    updateExtraInfo(current) {
        // Update humidity
        const humidityElement = document.getElementById('humidity');
        if (humidityElement) {
            humidityElement.textContent = `${current.humidity}%`;
        }

        // Update wind speed
        const windSpeedElement = document.getElementById('wind-speed');
        if (windSpeedElement) {
            windSpeedElement.textContent = `${current.wind_kph} km/h`;
        }

        // Update UV index
        const uvIndexElement = document.getElementById('uv-index');
        if (uvIndexElement) {
            uvIndexElement.textContent = current.uv;
        }

        // Update feels like temperature
        const feelsLikeElement = document.getElementById('feels-like');
        if (feelsLikeElement) {
            feelsLikeElement.textContent = this.weatherAPI.formatTemperature(current.feelslike_c);
        }
    }

    // ========================================
    // CITY SUGGESTIONS
    // ========================================

    async showCitySuggestions(query) {
        try {
            const suggestions = await this.weatherAPI.getCitySuggestions(query);
            this.renderSuggestions(suggestions);
        } catch (error) {
            console.error('Error showing suggestions:', error);
        }
    }

    renderSuggestions(suggestions) {
        const suggestionsContainer = document.getElementById('city-suggestions');
        if (!suggestionsContainer) return;

        if (suggestions.length === 0) {
            suggestionsContainer.innerHTML = '<div class="no-suggestions">No cities found</div>';
            suggestionsContainer.classList.add('show');
            return;
        }

        suggestionsContainer.innerHTML = '';

        suggestions.forEach(suggestion => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'city-suggestion-item';

            suggestionItem.innerHTML = `
                <svg class="suggestion-icon" fill="currentColor" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
                    <path d="M128,16a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,120a32,32,0,1,1,32-32A32,32,0,0,1,128,136Z"></path>
                </svg>
                <span class="suggestion-text">${suggestion.name}</span>
                <span class="suggestion-country">${suggestion.country}</span>
            `;

            // Add click event to suggestion item
            suggestionItem.addEventListener('click', () => {
                this.searchCity(suggestion.name);
                document.getElementById('city').value = '';
                this.hideSuggestions();
            });

            suggestionsContainer.appendChild(suggestionItem);
        });

        suggestionsContainer.classList.add('show');
    }

    hideSuggestions() {
        const suggestionsContainer = document.getElementById('city-suggestions');
        if (suggestionsContainer) {
            suggestionsContainer.classList.remove('show');
        }
    }

    // ========================================
    // UTILITY METHODS
    // ========================================

    showLoading(show) {
        // You can add a loading spinner here if needed
        if (show) {
            console.log('Loading weather data...');
        } else {
            console.log('Weather data loaded successfully');
        }
    }

    showError(message) {
        console.error(message);
        // You can add error display UI here if needed
        alert(message);
    }
}

// ========================================
// APP INITIALIZATION
// ========================================

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});