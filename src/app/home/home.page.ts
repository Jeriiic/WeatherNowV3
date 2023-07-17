import { Component,ViewChild, ElementRef } from '@angular/core';
import { environment } from './../../environments/environment';
import { HttpClient } from '@angular/common/http';

const API_URL = environment.API_URL;
const API_KEY = environment.API_KEY;

interface ForecastItem {
  date: string;
  tempMin: number;
  tempMax: number;
  weather: string;
  weatherIcon: string;
  // Add more properties as needed
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  @ViewChild('mainArrow', { static: false }) mainArrow!: ElementRef | undefined;
  windInfo: any;

  weatherTemp: any;
  todayDate = new Date();
  cityName = '';
  weatherIcon: any;
  weatherDetails: any;
  name = '';
  sunrise: string = '';
  sunset: string = '';
  forecastData: any[] = [];
  loading: boolean = true;
  currentDate = new Date();
  currentDayHourlyForecast: any[] = [];
  weatherIcon1: any;
  fiveDayForecast: ForecastItem[] = [];
  weatherIcon2: any;
  showCard = true;
  displayedCityName: string = '';


  constructor(public httpClient: HttpClient) {}

  loadData() {
    if (this.cityName) {
      this.httpClient.get(`${API_URL}/weather?q=${this.cityName}&appid=${API_KEY}`).subscribe(
        (results: any) => {
          console.log(results);
          this.weatherTemp = results.main;
          this.name = results.name;
          console.log(this.weatherTemp);
          this.weatherDetails = results.weather;
          console.log(this.weatherDetails);
          this.loading = false;

          if (this.weatherDetails && this.weatherDetails.length > 0) {
            const weatherIcon = this.weatherDetails[0].icon;
            this.weatherIcon = `https://openweathermap.org/img/wn/${weatherIcon}@4x.png`;
          }

          this.sunrise = this.formatTime(results.sys.sunrise * 1000);
          this.sunset = this.formatTime(results.sys.sunset * 1000);

          const { lat, lon } = results.coord;
          this.httpClient
            .get(`${API_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&cnt=40`)
            .subscribe(
              (forecast: any) => {
                console.log(forecast);
                this.forecastData = forecast.list;
                this.currentDayHourlyForecast = this.getHourlyForecastForCurrentDate();
                this.fiveDayForecast = this.getNextFiveDaysForecast();
                this.loading = false;
                this.windInfo = results.wind;
                

                if (results.wind) {
                  this.windInfo = results.wind;
                  this.setArrowRotation();
                }

                if (forecast.weather && forecast.weather.length > 0) {
                  const weatherIcon1 = forecast.weather[0].icon;
                  forecast.weatherIcon = `https://openweathermap.org/img/wn/${weatherIcon1}@4x.png`;
                }
                this.showCard = true;
              },
              (error: any) => {
                console.log('Error:', error);
              }
            );
        },
        (error: any) => {
          console.log('Error:', error);
          this.loading = false;
        }
      );
    } else {
      this.loading = true;
    }
  }

  onSearchClick() {
    this.cityName = this.capitalizeFirstLetter(this.cityName);
    this.loadData();
  }

  onSearchClear() {
    this.cityName = '';
    this.cityName = this.capitalizeFirstLetter(this.name);
    this.resetPage(); // Call the resetPage method
  }

  resetPage() {
    this.showCard = false; // Hide the weather card

    // Reset other properties
    this.weatherTemp = null;
    this.todayDate = new Date();
    this.weatherIcon = null;
    this.weatherDetails = null;
    this.name = '';
    this.sunrise = '';
    this.sunset = '';
    this.forecastData = [];
    this.loading = true;
    this.currentDate = new Date();
    this.currentDayHourlyForecast = [];
    this.fiveDayForecast = [];

    // Add a slight delay to simulate the refresh effect
    setTimeout(() => {
      this.showCard = true;
    }, 100);
  }

  capitalizeFirstLetter(str: string): string {
    if (str && str.length > 0) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
    return str;
  }

  onSearchInput(event: any) {
    const inputValue = event.target.value;
    if (inputValue.trim() === '') {
      this.resetPage();
    } else {
      this.showCard = false;
    }
  }

  getNextFiveDaysForecast(): ForecastItem[] {
    const currentDate = new Date();
    const nextFiveDays: ForecastItem[] = [];

    for (const forecast of this.forecastData) {
      const forecastDate = new Date(forecast.dt_txt);

      if (forecastDate.getDate() !== currentDate.getDate()) {
        const forecastDateString = forecastDate.toISOString().split('T')[0];
        const existingForecast = nextFiveDays.find((item) => item.date === forecastDateString);

        if (existingForecast) {
          if (forecast.main.temp_min < existingForecast.tempMin) {
            existingForecast.tempMin = forecast.main.temp_min;
          }
          if (forecast.main.temp_max > existingForecast.tempMax) {
            existingForecast.tempMax = +(forecast.main.temp_max - 273.15).toFixed(0);
          }
        } else {
          const weatherIcon = forecast.weather[0].icon;
          nextFiveDays.push({
            date: forecastDateString,
            tempMin: +(forecast.main.temp_min - 273.15).toFixed(0),
            tempMax: +(forecast.main.temp_max - 273.15).toFixed(0),
            weather: forecast.weather[0].description,
            weatherIcon: `https://openweathermap.org/img/wn/${weatherIcon}@4x.png`,
          });
        }

        if (nextFiveDays.length === 5) {
          break;
        }
      }
    }

    return nextFiveDays;
  }

  getHourlyForecastForCurrentDate(): any[] {
    const currentDateString = this.currentDate.toISOString().split('T')[0];
    const hourlyForecast = this.forecastData.filter((forecast: any) => {
      const forecastDateString = forecast.dt_txt.split(' ')[0];
      return forecastDateString === currentDateString;
    });

    return hourlyForecast.map((forecast: any) => {
      const weatherIcon = forecast.weather[0].icon;
      return {
        time: this.formatTime(forecast.dt * 1000),
        temp: (forecast.main.temp - 273.15).toFixed(1),
        weatherIcon: `https://openweathermap.org/img/wn/${weatherIcon}@4x.png`,
      };
    });
  }

  formatTime(time: number): string {
    const date = new Date(time);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = (hours % 12 || 12).toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    return `${formattedHours}:${formattedMinutes} ${period}`;
  }

  simplifyWindDirection(degrees: number): string {
    const directions = ['North', 'NorthEast', 'East', 'SouthEast', 'South', 'SouthWest', 'West', 'NorthWest'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  }

  simplifyWindGust(gust: number | undefined): string {
    if (gust !== undefined) {
      // Ensure the value is a number and then format it with the .toFixed() method
      const formattedGust = Number(gust).toFixed(1);
      return formattedGust + ' m/s';
    } else {
      // Return a default value or an error message, depending on your preference
      return 'N/A';
    }
  }
  
  simplifyWindSpeed(speed: number): string {
    return speed.toFixed(2) + ' m/s';
  }

  ngAfterViewChecked() {
    this.setArrowRotation();
  }
  setArrowRotation() {
    if (this.mainArrow && this.mainArrow.nativeElement && this.windInfo) {
      this.mainArrow.nativeElement.style.transform = `rotate(${this.windInfo.deg}deg)`;
    }
  }
}
