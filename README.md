# Ye Olde Weather Dashboard

Ye Olde Weather Dashboard is a simple monotone weather dashboard that takes on the coder/techy aesthetic. It is built with Next.js and provides current weather conditions, hourly and daily forecasts, historical weather data, air quality information, and UV index. The dashboard features a responsive design, dark mode support, and customizable unit settings.

## Features

- 🌡️ Current weather conditions
- 🕰️ Hourly forecast
- 📅 Daily forecast
- 📜 Historical weather data
- 💨 Air quality information
- ☀️ UV index
- 🌐 Location search (automatic based on IP and manual)
- 🌙 Dark mode support
- 🌡️ Multiple unit conversions
- 📱 Responsive design
- ⚙️ Customizable settings
  - Temperature units (°C, °F, K, °R, °Ré, °Rø, °N, °D)
  - Wind speed units (km/h, m/s, mph, kts, ft/s, BF, F, EF, SS)
  - Humidity units (%, decimal)
  - Precipitation units (mm, in, cm)
  - Time display options
  - Precision settings

## Technologies Used

### Core
- [Next.js](https://nextjs.org/) - A React framework for building server-side rendered and static websites
- [React](https://reactjs.org/) - A JavaScript library for building user interfaces
- [TypeScript](https://www.typescriptlang.org/) - A typed superset of JavaScript that compiles to plain JavaScript

### Styling & UI
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework for rapidly building custom user interfaces
- [Framer Motion](https://www.framer.com/motion/) - A production-ready motion library for React

### Utilities
- [Axios](https://axios-http.com/) - A promise-based HTTP client for the browser and Node.js
- [date-fns](https://date-fns.org/) - A modern JavaScript date utility library

## APIs

### Weather Data
- [Open-Meteo](https://open-meteo.com/) - A free weather API providing global weather data
  - Current conditions
  - Hourly forecasts
  - Daily forecasts
  - Historical data
  - Air quality information

### Geolocation Services
- [ip-api](https://ip-api.com/) - Primary geolocation service (45 requests/minute)
- [ipwho.is](https://ipwho.is/) - Secondary geolocation service
- [ipinfo.io](https://ipinfo.io/) - Tertiary geolocation service
- [ipapi.co](https://ipapi.co/) - Fallback geolocation service

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgements

Special thanks to:
- The Open-Meteo team for providing free and reliable weather data
- The various IP geolocation services that make location detection possible
- The open-source community for the amazing tools and libraries

### Resources Used
- [Heroicons](https://heroicons.com/) - A set of free MIT-licensed high-quality SVG icons
- [1584 Pragmatica Lima Font](https://www.dafont.com/1584-pragmatica-lima.font) - A free font used for the title

---

Visit [www.yeoldweather.com](https://www.yeoldweather.com) to check out Ye Olde Weather Dashboard in action!
