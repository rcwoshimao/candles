# Candles App - Project Structure & Architecture

## Project Overview
The Candles application is an interactive emotional mapping platform where users can place "candles" on a map to represent their emotions at specific locations. The app uses React with Vite, integrates with Supabase for data persistence, and features a sophisticated emotion categorization system.

## Core Architecture

### Main Entry Points
- `src/main.jsx` - React app entry point using React 19 RC
- `src/App.jsx` - Root component that renders the Sidebar and MapComponent
- `src/lib/supabase.js` - Supabase client configuration for database operations

## Component Structure Analysis

### 1. Map Component (`src/Components/Map/MapComponent.jsx`)
**Purpose**: Central interactive map interface using React-Leaflet

**Key Features**:
- Interactive map with dark theme (CartoDB tiles)
- Candle placement system with 2-step process (emotion selection → placement)
- Real-time marker management with Supabase integration
- User authentication via localStorage-generated UUIDs
- Debug panel for development
- Zoom-based candle sizing
- World bounds restriction

**State Management**:
- `markers`: Array of all candle markers from database
- `tempPosition`: Temporary position for candle placement
- `selectedEmotion`: Currently selected emotion for new candle
- `currentStep`: Multi-step candle creation process (1=emotion selection, 2=placement)
- `userCandles`: Array of user's own candle IDs
- `zoomLevel`: Current map zoom level for dynamic sizing

### 2. Candle System (`src/Components/Candle/`)

#### `Candle.jsx`
Individual candle markers with:
- Dynamic sizing based on zoom level
- Emotion-based color coding
- Interactive popups with timestamp information
- Delete functionality for user-owned candles
- Temporary candle placement with drag functionality
- Memoized rendering for performance optimization

#### `CandleCreationPopup.jsx`
Multi-step candle creation interface:
- Step 1: Emotion selection via emotion wheel
- Step 2: Map placement confirmation
- Smooth animations using Framer Motion
- Styled components for consistent UI

#### `EmotionWheel.jsx`
Interactive emotion selection interface:
- Circular layout with 7 main emotions
- Sub-emotion expansion on hover/selection
- Color-coded emotion categories
- 28 total sub-emotions across 7 categories
- 3D perspective animations

### 3. Sidebar System (`src/Components/Sidebar/`)

#### `Sidebar.jsx`
Collapsible analytics panel with:
- Animated circular expansion using Framer Motion
- Resizable width (200-600px range)
- Chart container integration
- User statistics display
- Persistent width storage in localStorage
- Custom resize handle with mouse event handling

#### `MenuToggle.jsx`
Hamburger menu button for sidebar control

#### `Navigation.jsx`
Navigation component (referenced but not shown in detail)

#### `use-dimensions.js`
Custom hook for responsive sizing using ResizeObserver

### 4. Chart System (`src/Components/Charts/`)

#### `ChartContainer/ChartContainer.jsx`
Wrapper for chart components with loading states

#### `Charts/EmotionDistributionChart.jsx`
Bar chart showing emotion distribution:
- Dynamic width calculations based on data
- Emotion color coding
- Responsive design

#### `Common/BaseChart.jsx`
Reusable chart base component

#### `emotionParentMap.js`
Mapping of sub-emotions to parent categories for consistent grouping

### 5. Utility Components

#### `CreateCandleButton.jsx`
Floating action button for candle creation:
- Styled with Emotion
- Hover and active state animations
- Fixed positioning at bottom center

## Data Flow & State Management

### User Authentication
- UUID-based user identification stored in localStorage
- Automatic generation on first visit
- Persistent across sessions

### Candle Data
- Stored in Supabase 'markers' table
- Fields: id, position, emotion, timestamp, user_timestamp, user_id
- Real-time synchronization with database

### Local State Management
- React hooks manage UI state, temporary positions, and user interactions
- localStorage for persistent user preferences
- Optimistic updates for better UX

### Real-time Updates
- Supabase integration for live data synchronization
- Automatic marker fetching on component mount
- Real-time deletion and creation

## Emotion System

### Main Emotions (7)
1. **Happy** - #FFD700 (gold)
2. **Sad** - #4682B4 (steel blue)
3. **Angry** - #FF4500 (orange red)
4. **Surprised** - #FFA500 (orange)
5. **Disgusted** - #32CD32 (lime green)
6. **Fearful** - #9932CC (dark orchid)
7. **Tired** - #A9A9A9 (dark gray)

### Sub-emotions (28 total)
Each main emotion has 4 sub-emotions:
- **Happy**: amused, delighted, jovial, blissful
- **Sad**: depressed, sorrow, grief, lonely
- **Angry**: frustrated, annoyed, irritated, enraged
- **Surprised**: amazed, astonished, shocked, confused
- **Disgusted**: revolted, contempt, aversion, repulsed
- **Fearful**: anxious, scared, terrified, nervous
- **Tired**: exhausted, drained, weary, fatigued

### Color Coding
- Each emotion has distinct visual representation
- CSS variables for consistent theming
- Glow effects for visual appeal
- Hierarchical mapping for analytics

## Technical Stack

### Frontend
- **React**: 19.0.0-rc.1 (latest RC version)
- **Vite**: 6.3.1 (build tool and dev server)
- **Emotion**: 11.14.0 (styled components)
- **React-DOM**: 19.0.0-rc.1

### Maps & Visualization
- **React-Leaflet**: 5.0.0-rc.2 (React wrapper for Leaflet)
- **Leaflet**: 1.9.4 (mapping library)
- **React-Leaflet-Markercluster**: 5.0.0-rc.0 (marker clustering)

### Animations & UI
- **Framer Motion**: 12.9.2 (animation library)
- **Lucide React**: 0.503.0 (icon library)

### Database & Backend
- **Supabase**: 2.49.4 (PostgreSQL + real-time features)
- **@supabase/supabase-js**: Client library

### Utilities
- **date-fns**: 4.1.0 (date manipulation)
- **date-fns-tz**: 3.2.0 (timezone support)

### Development Tools
- **ESLint**: 9.22.0 (code linting)
- **Tailwind CSS**: 4.1.4 (utility-first CSS)
- **PostCSS**: 8.5.3 (CSS processing)
- **Autoprefixer**: 10.4.21 (CSS vendor prefixes)

## Performance Considerations for Node.js Integration

### Current Client-Side Architecture
The application is currently client-side heavy with:
- Direct Supabase calls from React components
- Client-side data processing and filtering
- Real-time updates handled in React
- Chart rendering on the client
- No server-side caching or optimization

### Areas for Node.js Performance Improvements

#### 1. Server-side Data Aggregation
- Pre-calculate emotion distribution statistics
- Aggregate user analytics
- Reduce client-side computation

#### 2. Caching Layer
- Redis or in-memory caching for frequently accessed data
- Cache emotion mappings and configurations
- Reduce database query load

#### 3. API Rate Limiting & Optimization
- Implement request throttling
- Batch database operations
- Optimize Supabase query patterns

#### 4. Server-side Rendering
- Initial page load optimization
- SEO improvements
- Faster perceived load times

#### 5. Background Processing
- Analytics calculation in background jobs
- Data cleanup and maintenance
- Report generation

#### 6. Real-time Optimization
- WebSocket connections for live updates
- Efficient event broadcasting
- Connection pooling

### Recommended Node.js Integration Strategy

1. **Express.js Backend** with API routes
2. **Redis** for caching and session management
3. **WebSocket** (Socket.io) for real-time features
4. **Background job processing** with Bull/BullMQ
5. **API gateway** for request optimization
6. **Server-side rendering** with Next.js or similar

This would transform the current client-heavy architecture into a more scalable, performant full-stack application. 