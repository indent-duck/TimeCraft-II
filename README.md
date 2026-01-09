# TimeCraft - MERN Stack with Expo

A task management app built with MongoDB, Express, React Native (Expo SDK 54), and Node.js.

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud)
- Expo CLI: `npm install -g @expo/cli`

### Installation

1. Install all dependencies:
```bash
npm run install-all
```

2. Start MongoDB (if using local installation)

3. Start the development servers:
```bash
npm run dev
```

This will start both the Express server (port 3001) and Expo development server.

### Individual Commands

- Start only server: `npm run server`
- Start only client: `npm run client`
- Install client deps: `npm run install-client`
- Install server deps: `npm run install-server`

## Project Structure

```
TimeCraft/
├── client/          # Expo React Native app
│   ├── App.js       # Main app component
│   ├── app.json     # Expo configuration
│   └── package.json
├── server/          # Express API server
│   ├── server.js    # Main server file
│   ├── .env         # Environment variables
│   └── package.json
└── package.json     # Root package file
```

## Features

- Task creation and management
- MongoDB data persistence
- Real-time updates
- Cross-platform (iOS, Android, Web)
- Expo SDK 54 compatible

## API Endpoints

- GET /api/tasks - Get all tasks
- POST /api/tasks - Create new task
- PUT /api/tasks/:id - Update task
- DELETE /api/tasks/:id - Delete task