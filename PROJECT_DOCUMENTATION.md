# IOT-Dash Project Documentation

## 1. Tech Stack

### Frontend

| Technology | Version / Source | Where Used | Purpose |
|---|---:|---|---|
| React | `^19.1.1` | `package.json`, `index.tsx`, all `.tsx` files | Component-based UI |
| React DOM | `^19.1.1` | `package.json`, `index.tsx` | Browser rendering via `ReactDOM.createRoot` |
| TypeScript | `~5.8.2` | `tsconfig.json`, `.tsx`, `.ts` files | Static typing for application code |
| Vite | `^6.2.0` | `package.json`, `vite.config.ts` | Development server and production bundler |
| Recharts | `^3.1.2` | `components/Gauge.tsx`, `components/AnalyticsCharts.tsx`, `components/RealtimeChart.tsx` | Gauges, line charts, area charts, and bar charts |
| Tailwind CSS CDN | Loaded from `https://cdn.tailwindcss.com` | `index.html` | Utility-first styling |
| Import Maps | Browser-native import map | `index.html` | Maps React/Recharts imports to CDN URLs from `aistudiocdn.com` |

### Backend / Data Services

| Technology | Version / Source | Where Used | Purpose |
|---|---:|---|---|
| Firebase Realtime Database REST API | External managed service | `hooks/useSolarData.ts`, `send_data.js` | Stores latest IoT telemetry at the database root `.json` endpoint |
| Browser `fetch` API | Native browser/Node runtime API | `hooks/useSolarData.ts`, commented block in `send_data.js` | Reads and optionally writes telemetry over HTTP |
| Browser `localStorage` | Native browser API | `hooks/useSolarData.ts` | Persists recent historical dashboard samples locally |

### Build, DevOps, and Tooling

| Tool | Version | Where Used |
|---|---:|---|
| Vite dev server | `^6.2.0` | `npm run dev` |
| Vite production build | `^6.2.0` | `npm run build` |
| Vite preview server | `^6.2.0` | `npm run preview` |
| Node type definitions | `^22.14.0` | `@types/node` in `package.json` |
| TypeScript compiler options | ES2022, ESNext modules, `react-jsx` | `tsconfig.json` |

### Testing

No test framework, test script, test files, or CI configuration were found in this repository.

---

## 2. Backend Concepts and Key Methods

This repository does not contain a traditional application backend such as Express, NestJS, Fastify, Django, Rails, or Laravel. There are no in-repository controllers, route handlers, service classes, database migrations, or server middleware.

The backend-like behavior is implemented through Firebase Realtime Database plus client-side data processing.

### Firebase Realtime Database as Backend-as-a-Service

**What it is:** A managed realtime JSON database exposed through Firebase REST endpoints.

**Why it is used here:** The dashboard needs a central place where ESP32 hardware can publish telemetry and the React app can read the latest values.

**How it works in this project:**

1. The app reads from `https://dashboard-s37f-default-rtdb.firebaseio.com/.json`.
2. `useSolarData` calls `fetchLatestData()` every 2 seconds while live mode is enabled.
3. The response is parsed as JSON.
4. If the payload has a fresh `timestamp`, it is mapped into the local `SolarData` shape.
5. The dashboard renders the latest mapped values.
6. Historical samples are retained locally in the browser, not in Firebase.

**Where in code:**

- `hooks/useSolarData.ts`
  - `useSolarData(isLive: boolean)`
  - `fetchLatestData`
- `send_data.js`
  - `FIREBASE_URL`
  - commented `setInterval(async () => { ... })`

### REST Polling

**What it is:** A client repeatedly requests data from an HTTP endpoint on a fixed interval.

**Why it is used here:** The UI needs near-real-time ESP32 telemetry, but the app does not use WebSockets or Firebase SDK listeners.

**How it works in this project:**

1. `App` calls `useSolarData(isLive)`.
2. Inside `useSolarData`, a `useEffect` starts an interval when `isLive` is true.
3. `fetchLatestData()` runs immediately, then every 2 seconds.
4. When `isLive` becomes false, the interval is cleared.
5. The latest data drives `DashboardView`.

**Where in code:**

- `App.tsx`
  - `App`
- `hooks/useSolarData.ts`
  - `useSolarData`
  - `fetchLatestData`
  - `intervalIdRef`
  - `window.setInterval(fetchLatestData, 2000)`
  - `clearInterval(intervalIdRef.current)`

### Stale Data Detection

**What it is:** Logic that marks incoming telemetry invalid if it is too old.

**Why it is used here:** The dashboard should only show data as live when the ESP32 is actively publishing updates.

**How it works in this project:**

1. `fetchLatestData()` reads `data.timestamp`.
2. The timestamp is converted to milliseconds.
3. The age is calculated as `Date.now() - firebaseTimestamp`.
4. Data is considered live only if it is less than 10 seconds old.
5. If stale or missing, `isDataAvailable` becomes false and the dashboard does not update with that payload.

**Where in code:**

- `hooks/useSolarData.ts`
  - `fetchLatestData`
  - `firebaseTimestamp`
  - `dataAge`
  - `isLiveData`
  - `setIsDataAvailable(false)`

### Data Normalization

**What it is:** Converting raw backend/device data into the UI's expected application model.

**Why it is used here:** ESP32/Firebase payloads may contain overlapping or missing fields such as `ldrValue` and `intensity`.

**How it works in this project:**

1. Firebase JSON is read as `data`.
2. `ldrValue` falls back to `data.intensity`.
3. `intensity` falls back to `data.ldrValue`.
4. Other fields get defaults: `servoAngle = 90`, `distance = 300`, `temperature = 25`, `humidity = 0`.
5. The normalized result is stored in a `SolarData` object.

**Where in code:**

- `hooks/useSolarData.ts`
  - `fetchLatestData`
  - `mappedData`
- `types.ts`
  - `SolarData`

### Derived Solar Metrics

**What it is:** Client-side calculation of metrics that are not directly supplied by the hardware.

**Why it is used here:** The ESP32 provides raw sensor readings, while the dashboard displays higher-level values such as efficiency, energy, and battery percentage.

**How it works in this project:**

1. Temperature affects `baseEfficiency`.
2. Light intensity is normalized from ADC range `0-4095` to a rough `0-1000` lux scale.
3. Power is calculated from normalized intensity, panel max power, and efficiency.
4. Energy is estimated from generated power.
5. Battery level is simulated using net generated power minus system consumption.

**Where in code:**

- `hooks/useSolarData.ts`
  - `fetchLatestData`
  - `baseEfficiency`
  - `powerGeneratedW`
  - `simulatedEnergyValue`
  - `batteryLevelRef`
  - `simulatedBattery`
- `hooks/useSolarData.ts`
  - `simulateNextDataPoint`, which exists but is not called by the live Firebase path

### Client-Side Historical Storage

**What it is:** Persisting historical telemetry in the browser using `localStorage`.

**Why it is used here:** The app provides analytics without a backend history table or Firebase historical collection.

**How it works in this project:**

1. On mount, `loadHistoryFromStorage()` reads `iot_dashboard_history`.
2. Every minute, the latest mapped live data is appended to `historicalData`.
3. `saveHistoryToStorage()` filters records to the last 7 days.
4. The filtered array is saved back to `localStorage`.
5. `AnalyticsView` filters this data by day and passes it to `AnalyticsCharts`.

**Where in code:**

- `hooks/useSolarData.ts`
  - `STORAGE_KEY`
  - `MAX_HISTORY_DAYS`
  - `saveHistoryToStorage(data: SolarData[])`
  - `loadHistoryFromStorage()`
  - `historicalData`
- `views/AnalyticsView.tsx`
  - `filteredData`
- `components/AnalyticsCharts.tsx`
  - `aggregateDataByHour`

### Optional Simulation Script

**What it is:** A Node/browser-compatible script intended to write random data into Firebase.

**Why it is used here:** It was originally intended to test the dashboard without real ESP32 hardware.

**How it works in this project:**

1. `send_data.js` defines the same Firebase root URL.
2. The active code only logs that simulation is disabled.
3. A commented `setInterval` block can generate random telemetry.
4. If uncommented, it sends a `PUT` request every 2 seconds to Firebase.

**Where in code:**

- `send_data.js`
  - `FIREBASE_URL`
  - commented `setInterval(async () => { ... })`
  - commented `fetch(FIREBASE_URL, { method: 'PUT', ... })`

### Concepts Not Implemented

| Concept | Status |
|---|---|
| JWT authentication | Not implemented |
| OAuth | Not implemented |
| Session auth | Not implemented |
| API keys for Firebase requests | Not implemented in client requests |
| Express/Nest/Fastify middleware | Not present |
| CORS handling | Not implemented in repo; Firebase handles external access |
| Rate limiting | Not implemented |
| Server-side caching | Not implemented |
| Queues/background jobs | Not implemented |
| Webhooks | Not implemented |
| WebSockets / Socket.io | Not implemented |
| Server controllers/services | Not present |
| Server logging framework | Not present |

---

## 3. Frontend Concepts and Key Methods

### Single Page Application Shell

**What it is:** A browser-rendered React application with internal view switching instead of route-based navigation.

**Why it is used here:** The project only needs two screens: a live dashboard and historical analytics.

**How it works in this project:**

1. `index.tsx` mounts `App` into the HTML root element.
2. `App` stores `currentView` as either `dashboard` or `analytics`.
3. `Sidebar` changes `currentView`.
4. `App` conditionally renders `DashboardView` or `AnalyticsView`.

**Where in code:**

- `index.tsx`
  - `ReactDOM.createRoot`
- `App.tsx`
  - `App`
  - `currentView`
  - `setCurrentView`
- `components/Sidebar.tsx`
  - `Sidebar`
- `types.ts`
  - `ViewType`

### Live/Pause State

**What it is:** A global UI control that starts or stops live data polling.

**Why it is used here:** Users may want to pause the stream while inspecting current values.

**How it works in this project:**

1. `App` owns `isLive`.
2. `Header` receives `isLive` and `setIsLive`.
3. Toggling the header button updates `isLive`.
4. `useSolarData` starts or clears the polling interval based on `isLive`.

**Where in code:**

- `App.tsx`
  - `isLive`
  - `setIsLive`
- `components/Header.tsx`
  - `Header`
- `hooks/useSolarData.ts`
  - `useSolarData`

### Per-Widget Pause Controls

**What it is:** Individual dashboard cards/charts can freeze their displayed value while the rest of the dashboard continues updating.

**Why it is used here:** Users can inspect one metric without stopping the entire live stream.

**How it works in this project:**

1. `DashboardView` stores pause state in `pausedStates`.
2. `togglePause(id)` flips the pause flag for a widget.
3. A `useEffect` updates `displayData` from incoming `data`.
4. For paused fields, the previous displayed value is retained.
5. `PausableWrapper` renders pause/resume buttons and an overlay.

**Where in code:**

- `views/DashboardView.tsx`
  - `pausedStates`
  - `displayData`
  - `togglePause`
- `components/PausableWrapper.tsx`
  - `PausableWrapper`

### Live Charting

**What it is:** A rolling chart of recent live values.

**Why it is used here:** Users can see short-term movement in temperature and light intensity.

**How it works in this project:**

1. `DashboardView` passes current temperature and intensity to `RealtimeChart`.
2. `RealtimeChart` appends each update to local component state.
3. It keeps only the most recent 20 points.
4. Recharts renders the values as two line series.

**Where in code:**

- `views/DashboardView.tsx`
  - `RealtimeChart`
- `components/RealtimeChart.tsx`
  - `RealtimeChart`
  - `setData`

### Historical Analytics

**What it is:** Aggregated visual analytics over locally stored telemetry.

**Why it is used here:** Users can review trends by day without a backend analytics database.

**How it works in this project:**

1. `AnalyticsView` receives `historicalData` from `App`.
2. It lets users select a day from the current week up to today.
3. It filters data points for the selected day.
4. `AnalyticsCharts` aggregates records by hour.
5. Recharts renders LDR, distance, motion, LED, night mode, energy, and temperature charts.

**Where in code:**

- `views/AnalyticsView.tsx`
  - `selectedDay`
  - `availableDays`
  - `filteredData`
- `components/AnalyticsCharts.tsx`
  - `aggregateDataByHour`

### Dormant Map View

**What it is:** A Leaflet-style map component using a global `L` object and Carto/OSM tiles.

**Why it is here:** It appears intended to display GPS position, but it is not currently wired into the app.

**How it works in this project:**

1. `MapView` expects a `gps` prop.
2. It calls `L.map`, `L.tileLayer`, and `L.marker`.
3. It updates marker position when `gps` changes.
4. No active view imports or renders it.
5. It imports `GPS` from `types.ts`, but `types.ts` currently does not define `GPS`.

**Where in code:**

- `components/MapView.tsx`
  - `MapView`
  - `mapRef`
  - `markerRef`
- `types.ts`
  - missing `GPS` type

---

## 4. API Inventory

There are no in-repository API routes defined by this project. The app consumes Firebase Realtime Database REST endpoints directly.

### Firebase Realtime Database

| Method | Route | Description | Auth Required | Request Body | Response |
|---|---|---|---|---|---|
| `GET` | `https://dashboard-s37f-default-rtdb.firebaseio.com/.json` | Reads the latest IoT telemetry from the Firebase database root. Used by `fetchLatestData` every 2 seconds. | No auth token is supplied in this code. | None | JSON object expected to include fields like `timestamp`, `ldrValue`, `intensity`, `servoAngle`, `motionDetected`, `distance`, `ledStatus`, `isNight`, `temperature`, `humidity`. |
| `PUT` | `https://dashboard-s37f-default-rtdb.firebaseio.com/.json` | Replaces the Firebase database root with simulated telemetry. Present only in commented code. | No auth token is supplied in this code. | JSON with `energy`, `efficiency`, `battery`, `intensity`, `temperature`, `servoAngle`, `motionDetected`, and `gps`. | Firebase REST API returns the written JSON payload or Firebase error response. |

### External Asset/Data Requests

| Method | Route | Description | Auth Required | Request Body | Response |
|---|---|---|---|---|---|
| `GET` | `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png` | Map tile endpoint used by dormant `MapView`. | No | None | PNG map tiles. |

`components/MapView.tsx` is not currently imported by `App.tsx` or any active view, so the map tile route is not part of the current rendered app flow.

---

## 5. Architecture Diagram

### Current Runtime Architecture

```text
[ESP32 Hardware Device]
        |
        | writes latest sensor JSON
        v
[Firebase Realtime Database Root /.json]
        ^
        |
        | GET every 2 seconds
        |
[React App: useSolarData]
        |
        | normalize + validate timestamp + calculate derived metrics
        v
[App.tsx State]
        |
        +-----------------------------+
        |                             |
        v                             v
[DashboardView]                 [AnalyticsView]
        |                             |
        | live cards/gauges/charts    | filter historical records by day
        v                             v
[DataCard / Gauge / BatteryGauge / RealtimeChart]
                                      |
                                      v
                              [AnalyticsCharts]
```

### Data Processing Flow

```text
[Firebase JSON]
      |
      v
[fetchLatestData]
      |
      +--> [timestamp freshness check: < 10 seconds]
      |
      +--> [field normalization]
      |        ldrValue, intensity, servoAngle, distance,
      |        ledStatus, isNight, temperature, humidity
      |
      +--> [derived metrics]
      |        efficiency, energy, battery
      |
      v
[SolarData object]
      |
      +--> [latestData] --> [DashboardView]
      |
      +--> every 60 seconds
             |
             v
      [localStorage: iot_dashboard_history]
             |
             v
      [AnalyticsView] --> [AnalyticsCharts]
```

### UI Layer Architecture

```text
[index.html]
    |
    v
[index.tsx]
    |
    v
[App]
    |
    +--> [Sidebar]
    |
    +--> [Header]
    |
    +--> [useSolarData]
    |
    +--> [DashboardView]
    |        |
    |        +--> [PausableWrapper]
    |        +--> [DataCard]
    |        +--> [Gauge]
    |        +--> [BatteryGauge]
    |        +--> [RealtimeChart]
    |
    +--> [AnalyticsView]
             |
             +--> [AnalyticsCharts]
```

### Auth Flow

```text
[Client]
   |
   | direct unauthenticated REST request
   v
[Firebase Realtime Database /.json]
```

No JWT, session, OAuth, API key, role check, or auth middleware exists in this repository.

---

## 6. Problem Statement

This project solves the problem of monitoring an ESP32-based solar tracking and sensing system in real time. It gives users a browser dashboard for light intensity, LDR readings, distance, motion, LED status, servo angle, temperature, humidity, energy estimate, solar efficiency, and battery estimate.

The target users are students, makers, IoT developers, or project reviewers who need to observe a solar panel tracker prototype without reading raw serial logs or manually checking Firebase data.

Without this software, users would manually inspect sensor values through Arduino serial output, Firebase console snapshots, or device-side logs, then calculate efficiency, battery behavior, and trends themselves.

The core value proposition is a live visual dashboard for ESP32 solar telemetry with local historical analytics. It turns raw device readings into understandable cards, gauges, and charts so users can quickly evaluate whether the hardware is sensing, tracking, and producing energy as expected.

---

## 7. Authentication and Authorization

### Auth Strategy

No application authentication is implemented.

| Item | Status |
|---|---|
| JWT | Not used |
| Session cookies | Not used |
| OAuth | Not used |
| API key auth | Not used for Firebase requests |
| Firebase client auth | Not used |
| Roles / permissions | Not implemented |

### Token Generation, Storage, and Validation

There are no tokens generated, stored, refreshed, or validated in this repository.

### Roles and Permission Levels

No roles or permission levels exist.

### Auth Middleware Signature

No auth middleware exists.

```ts
// Not present in this codebase
```

### Security Implication

The React client directly calls:

```text
https://dashboard-s37f-default-rtdb.firebaseio.com/.json
```

No auth parameter or Firebase SDK-authenticated session is provided. Actual access control therefore depends entirely on Firebase Realtime Database rules configured outside this repository.

---

## 8. Database Design

### Databases Used

| Database | Type | Where Used | Purpose |
|---|---|---|---|
| Firebase Realtime Database | External JSON document database | `hooks/useSolarData.ts`, `send_data.js` | Stores latest IoT telemetry |
| Browser `localStorage` | Client-side key/value storage | `hooks/useSolarData.ts` | Stores recent historical data for analytics |

### Firebase Data Shape

The app expects the Firebase root object to contain telemetry similar to this:

```ts
{
  timestamp: string;
  ldrValue?: number;
  intensity?: number;
  servoAngle?: number;
  motionDetected?: boolean;
  distance?: number;
  ledStatus?: boolean;
  isNight?: boolean;
  temperature?: number;
  humidity?: number;
}
```

The app maps that into `SolarData`.

### `SolarData` Model

Defined in `types.ts`.

| Field | Type | Purpose |
|---|---|---|
| `timestamp` | `string` | ISO timestamp for the data point |
| `ldrValue` | `number` | Raw LDR ADC reading, expected range `0-4095` |
| `intensity` | `number` | Light intensity, currently equivalent/fallback to `ldrValue` |
| `servoAngle` | `number` | Servo position from `0-180` degrees |
| `motionDetected` | `boolean` | Motion detection status |
| `distance` | `number` | Ultrasonic distance in centimeters |
| `ledStatus` | `boolean` | LED on/off state |
| `isNight` | `boolean` | Day/night mode |
| `temperature` | `number` | DHT11 temperature in Celsius |
| `humidity` | `number` | DHT11 humidity percentage |
| `energy` | `number` | Client-calculated energy output |
| `efficiency` | `number` | Client-calculated solar efficiency |
| `battery` | `number` | Client-simulated battery level |

### Local Storage Design

| Key | Value |
|---|---|
| `iot_dashboard_history` | JSON-stringified `SolarData[]` |

Historical storage behavior:

- Controlled by `STORAGE_KEY` in `hooks/useSolarData.ts`.
- Retains only the last 7 days using `MAX_HISTORY_DAYS`.
- Saves a new historical point approximately once per minute.
- Loaded once when `useSolarData` mounts.

### Relationships

No relational database relationships exist. Data is a flat telemetry stream:

- Firebase root contains the latest known telemetry object.
- Local storage contains an array of historical `SolarData` records.

### Indexing, Migrations, and Seeding

| Feature | Status |
|---|---|
| Indexes | Not present in repository |
| Migrations | Not present |
| Seed scripts | Not present |
| Simulation/seeding helper | `send_data.js`, but disabled/commented |

---

## 9. Error Handling and Logging

### Global Error Handler

There is no global backend error handler because there is no backend server.

There is also no React error boundary.

### Client Error Handling

| Location | Error Handling |
|---|---|
| `index.tsx` | Throws `Error("Could not find root element to mount to")` if `#root` is missing |
| `hooks/useSolarData.ts` | Wraps Firebase fetch/process logic in `try/catch` |
| `hooks/useSolarData.ts` | Checks `response.ok` and throws on failed Firebase responses |
| `hooks/useSolarData.ts` | Wraps `localStorage` read/write in `try/catch` |

### Error Format Returned to Clients

No custom API responses are produced by this project. Firebase errors, if any, come from Firebase itself.

### Logging

The project uses native console logging only.

| File | Logging |
|---|---|
| `hooks/useSolarData.ts` | `console.error` for failed localStorage save/load and failed Firebase fetch/process |
| `send_data.js` | `console.log` explaining simulation is disabled |
| `send_data.js` | commented `console.log` and `console.error` for simulated writes |

No logging library such as Winston, Pino, Morgan, or Sentry is used.

### Custom Error Classes

No custom error classes were found.

---

## 10. Security Measures

### Implemented

| Measure | Where | Notes |
|---|---|---|
| Environment variable loading | `vite.config.ts` | Loads `GEMINI_API_KEY` and defines `process.env.API_KEY` / `process.env.GEMINI_API_KEY`, but no code currently uses it |
| Firebase response status check | `hooks/useSolarData.ts` | Throws if `response.ok` is false |
| Stale telemetry rejection | `hooks/useSolarData.ts` | Rejects data older than 10 seconds from `timestamp` |
| Local storage error isolation | `hooks/useSolarData.ts` | Storage failures are caught so the UI can continue |
| `.gitignore` excludes local/env-like files | `.gitignore` | Ignores `*.local`, logs, `node_modules`, `dist` |

### Not Implemented

| Security Measure | Status |
|---|---|
| Authentication | Not implemented |
| Authorization / roles | Not implemented |
| Firebase auth token usage | Not implemented |
| Input validation library | Not implemented |
| Request body validation | Not implemented |
| Sanitization | Not implemented |
| Rate limiting | Not implemented |
| Helmet/security headers | Not applicable; no server |
| SQL injection protection | Not applicable; no SQL database |
| NoSQL injection protection | Not implemented in app code |
| CSRF protection | Not applicable; no cookie-authenticated backend |
| Content Security Policy | Not implemented |
| Secret management beyond Vite env loading | Not present |

### Important Security Observation

The Firebase database URL is hard-coded in both `hooks/useSolarData.ts` and `send_data.js`. Since the client directly accesses the Firebase REST endpoint without an auth token, database read/write safety depends on Firebase rules outside this repository.

---

## 11. Project Structure

```text
IOT-Dash/
├── App.tsx
├── index.tsx
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── metadata.json
├── send_data.js
├── types.ts
├── hooks/
│   └── useSolarData.ts
├── views/
│   ├── DashboardView.tsx
│   └── AnalyticsView.tsx
└── components/
    ├── AnalyticsCharts.tsx
    ├── BatteryGauge.tsx
    ├── DataCard.tsx
    ├── Gauge.tsx
    ├── Header.tsx
    ├── MapView.tsx
    ├── PausableWrapper.tsx
    ├── RealtimeChart.tsx
    ├── Sidebar.tsx
    └── icons/
        └── Icons.tsx
```

### Root Files

| File | Purpose |
|---|---|
| `App.tsx` | Main application shell; owns selected view and live/pause state |
| `index.tsx` | React entrypoint; mounts `App` into `#root` |
| `index.html` | HTML shell; loads Tailwind CDN, import map, and `/index.tsx` |
| `package.json` | Project metadata, npm scripts, dependencies |
| `tsconfig.json` | TypeScript compiler configuration |
| `vite.config.ts` | Vite configuration, path alias, environment variable injection |
| `metadata.json` | Project description metadata |
| `types.ts` | Shared TypeScript types, primarily `SolarData` and `ViewType` |
| `send_data.js` | Disabled Firebase simulation writer script |

### `hooks/`

| File | Purpose |
|---|---|
| `hooks/useSolarData.ts` | Main data layer: fetches Firebase telemetry, checks freshness, maps fields, calculates derived metrics, stores history |

### `views/`

| File | Purpose |
|---|---|
| `views/DashboardView.tsx` | Live dashboard view with cards, gauges, and real-time chart |
| `views/AnalyticsView.tsx` | Historical analytics view with day filtering |

### `components/`

| File | Purpose |
|---|---|
| `components/DataCard.tsx` | Reusable metric card |
| `components/Gauge.tsx` | Radial efficiency gauge using Recharts |
| `components/BatteryGauge.tsx` | Battery percentage and charging/discharging display |
| `components/RealtimeChart.tsx` | Rolling 20-point real-time line chart |
| `components/AnalyticsCharts.tsx` | Hourly aggregate charts for LDR, distance, motion, LED, night mode, energy, and temperature |
| `components/PausableWrapper.tsx` | Adds per-widget pause/resume overlay controls |
| `components/Header.tsx` | Top bar with global live/pause toggle |
| `components/Sidebar.tsx` | Navigation between dashboard and analytics |
| `components/MapView.tsx` | Dormant Leaflet-based map component; not currently rendered and references missing `GPS` type |
| `components/icons/Icons.tsx` | Inline SVG icon components |

---

## 12. Frontend and Backend Summary

### Frontend Summary

The frontend is a Vite + React + TypeScript single-page dashboard. It has two main views: `DashboardView` for live metrics and `AnalyticsView` for historical charts. The UI is composed from reusable display components such as `DataCard`, `Gauge`, `BatteryGauge`, `RealtimeChart`, `AnalyticsCharts`, `Header`, `Sidebar`, and `PausableWrapper`.

The frontend owns nearly all application behavior: polling, stale-data detection, field normalization, derived metric calculation, local history persistence, day filtering, and chart aggregation.

### Backend Summary

There is no first-party backend server in this repository. Firebase Realtime Database is the effective backend, accessed through direct REST calls from the browser. The only backend-oriented local file is `send_data.js`, a disabled simulation script that can write random test data to Firebase if its commented block is restored.

### Overall Summary

`IOT-Dash` is a compact IoT monitoring application for ESP32 solar tracker telemetry. Its main architectural pattern is a frontend-heavy dashboard backed by Firebase as an external JSON data store. The app transforms raw device telemetry into live operational metrics and local historical analytics without requiring a custom API server.
