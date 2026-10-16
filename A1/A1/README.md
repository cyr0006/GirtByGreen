# GirtByGreen

GirtByGreen is a web app that helps Melbourne communities green their own patch of the city, one street, one garden, one tree at a time. It brings together suburb-level vegetation and heat data, a native plant catalog with grower reviews, an AI garden advisor, and local planting events in one place.

## Features

- **Vegetation Map** - explore tree cover, heat vulnerability and biodiversity across Melbourne suburbs on an interactive map.
- **Suburb Canopy Data** - compare vegetation cover and heat vulnerability figures across suburbs, sourced from Victoria's Vicmap and CoolingGreening datasets.
- **Click, Read, Plant** - browse a native plant catalog, filter by growing needs, and read reviews from other growers.
- **AI Garden Advisor** - chat with an AI assistant for planting advice tailored to your own garden project.
- **Events** - find and join community planting days, workshops and clean-up drives.
- **Community Impact** - track how many garden projects the community has completed over time.
- **Accounts and roles** - sign up and sign in with Firebase Authentication, manage your profile, and an admin dashboard for managing content and users.

## Tech stack

- **Frontend:** Vue 3, Vite, Vue Router, PrimeVue, Tailwind CSS
- **Data and visualisation:** Chart.js, D3, Leaflet (with marker clustering), FullCalendar
- **Backend:** Firebase (Authentication, Firestore, Cloud Functions, Hosting)
- **Other services:** SendGrid for email, Groq for AI chat
- **Editor:** Quill for rich text content, sanitized with DOMPurify / sanitize-html

## Getting started

### Requirements

- Node.js `^22.18.0` or `>=24.12.0`
- A Firebase project (for Authentication, Firestore and Cloud Functions)

### Installation

```sh
npm install
```

### Development

```sh
npm run dev
```

### Build for production

```sh
npm run build
```

### Preview the production build

```sh
npm run preview
```

### Lint and format

```sh
npm run lint
npm run format
```

## Project structure

```
src/
  views/        # Page-level components (Home, Events, VegetationMap, Profile, etc.)
  components/    # Reusable UI components
  composables/   # Shared Vue composables (e.g. auth state)
  router/        # Vue Router setup and route guards
  service/       # API and data access helpers
  firebase.js    # Firebase app initialisation
functions/       # Firebase Cloud Functions (email sending, AI chat, etc.)
```

## Deployment

The app is hosted on Firebase Hosting, with Firestore for data and Cloud Functions for server-side logic such as sending emails and sanitizing content. Firebase configuration lives in `firebase.json` and `firestore.rules`.

## License

This project was built for Monash University's FIT5032 unit and is not licensed for external use.
