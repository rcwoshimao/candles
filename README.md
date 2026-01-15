# Emotional Map - Anonymous Community Emotion Sharing

## React + Vite Template Information
This project is built using the React + Vite template, which provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:
- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

### Expanding the ESLint configuration
If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

---

## Application Documentation

### Overview
Emotional Map is a web application that allows users to anonymously share their emotions by placing virtual candles on a map. It creates a visual representation of community emotions across different locations, fostering a sense of shared experience while maintaining privacy.

## Core Features
- Interactive world map interface
- Anonymous emotion sharing through virtual candles
- Real-time visualization of community emotions
- Personal emotion tracking
- Responsive and dynamic candle visualization
- Data visualization through charts and analytics

## Technical Architecture

### Frontend Structure
```
src/
├── Components/
│   ├── Map/           # Main map interface
│   ├── Candle/        # Candle marker objecto n map
│   ├── Sidebar/       # Navigation and controls
│   └── Charts/        # Data visualization components
│   └── CreateCandle/  # CreateCandle popup interface
├── lib/               # Utilities and backend integration
└── assets/           # Static resources
```

### Key Components

#### Map Component (`MapComponent.jsx`)
- Built with React-Leaflet
- Handles map interactions and marker management
- Features:
  - Click-to-place candle functionality
  - Marker state management
  - Real-time updates
  - User interaction handling
  - Debug panel for development

#### Candle Component (`Candle.jsx`)
- Represents individual emotion markers on the map
- Features:
  - Dynamic sizing based on zoom level
  - Visual effects (glow and flicker)
  - Timestamp display
  - User ownership management
- Supported emotions seen in `Candle/emotions.json`

#### Sidebar Component
- Contains charts for visualization, seen `Charts/`

#### User System
- Anonymous user identification using UUID
- Stored in localStorage
- Users can:
  - Place candles
  - Delete their own candles
  - View all community candles

#### Backend (Supabase)
- Database table: `markers`
- Stores:

### Technical Stack
- Frontend: React with Vite
- Map: Leaflet/React-Leaflet
- Backend: Supabase
- Styling: CSS with custom animations
- State Management: React Hooks
- Date Handling: date-fns

## User Flow
1. User visits the application
2. System generates anonymous UUID (if not exists)
3. User can:
   - Click on map to place a candle
   - Select emotion from popup
   - View existing candles
   - Delete their own candles
   - Interact with data visualizations

## Data Visualization
- Charts component provides analytics and insights
- Visualizes:
  - Emotion distribution
  - Temporal patterns
  - Geographic clustering
  - User interaction metrics

## Privacy & Security
- Anonymous user system
- No personal data collection
- User can only delete their own candles
- Secure backend integration
- Local storage for user preferences only

## Development Notes
- Debug panel available for development
- Responsive design considerations
- Performance optimizations:
  - Memoized components
  - Efficient marker rendering
  - Optimized state management
  - Cached user data

## Future Considerations
- Enhanced data visualization
- Additional emotion categories
- Community features
- Advanced filtering options
- Mobile optimization
- Offline capabilities
