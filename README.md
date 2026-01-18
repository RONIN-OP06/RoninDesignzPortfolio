# RoninDesignz

Portfolio site built with React, Shadcn UI, and Three.js. Uses atomic design for component structure.

## Architecture

### Project Structure
```
src/
├── components/
│   ├── atoms/              # Basic building blocks
│   │   ├── GradientText.jsx
│   │   └── ValidationMessage.jsx
│   ├── molecules/          # Simple component groups
│   │   ├── FormField.jsx
│   │   ├── Header.jsx
│   │   └── Navigation.jsx
│   ├── organisms/          # Complex components
│   │   ├── SignUpForm.jsx
│   │   ├── ThreeJSScene.jsx
│   │   └── ParallaxBackground.jsx
│   ├── templates/          # Page layouts
│   │   ├── HomePage.jsx
│   │   ├── AboutPage.jsx
│   │   ├── PortfolioPage.jsx
│   │   ├── ContactPage.jsx
│   │   └── SignUpPage.jsx
│   └── ui/                 # Shadcn UI components
│       ├── button.jsx
│       ├── input.jsx
│       ├── label.jsx
│       └── card.jsx
├── lib/                    # Business logic
│   ├── config.js
│   ├── form-validator.js
│   ├── api-client.js
│   ├── threejs-scene.js
│   └── utils.js
└── App.jsx                 # Main application with routing
```

## Getting Started

```bash
npm install
npm run dev
```

App runs on `http://localhost:5173`

Build with `npm run build`

## Features

- React 18 + Vite
- React Router for navigation
- Shadcn UI components
- Three.js for 3D effects
- Parallax scrolling
- Form validation
- Responsive design
- Dark theme

## Pages

- `/` - Home
- `/about` - About page
- `/portfolio` - Portfolio showcase
- `/contact` - Contact form
- `/signup` - Sign up
- `/login` - Login

## Component Structure

- **atoms/** - Basic components (GradientText, ValidationMessage)
- **molecules/** - Simple combinations (FormField, Header, Navigation)
- **organisms/** - Complex components (SignUpForm, ThreeJSScene, ParallaxBackground)
- **templates/** - Page layouts (HomePage, AboutPage, etc.)

## Config

Settings in `src/lib/config.js`:
- API endpoints
- Validation rules
- Three.js settings
- Messages

## Email Setup

Create a `.env` file:

```env
EMAIL_USER=roninsyoutub123@gmail.com
EMAIL_PASS=your_app_password_here
RECIPIENT_EMAIL=roninsyoutub123@gmail.com
```

For Gmail, you need an app password (enable 2FA first).

Start server with `npm start`

## Tech Stack

- React 18
- React Router
- Vite
- Tailwind CSS
- Shadcn UI
- Three.js
- Express.js (backend)

## Notes

- ES modules
- Three.js only on signup/login pages
- Parallax on home page
- Responsive design
- Dark theme
