# NECS Bookmarks User Manual

Welcome to NECS Bookmarks, your streamlined solution for organizing and accessing your favorite links with professional efficiency.

## 🌟 Getting Started

NECS Bookmarks provides a clean, intuitive interface to help you manage your digital library.

### Key Features
- **Effortless Organization**: Links are categorized for quick discovery.
- **Modern Interface**: Enjoy a beautiful, Material-inspired design that adapts to your style.
- **Lightning Fast**: Optimized for speed so you can find what you need instantly.
- **Go Mobile**: Install the app on your device for quick access and offline use.
- **Privacy First**: Your data stays local and secure.

## 🛠 Using the App

### Navigating Categories
Use the navigation bar at the top or side to filter your bookmarks by category. This helps you focus on specific tasks, whether it's Productivity, Social, or Streaming.

### Searching for Bookmarks
Quickly find any link by using the search bar. Start typing, and the results will filter in real-time.

### Customizing Your Experience
Access the **Settings** (gear icon) to personalize the app:
- **Theme Modes**: Switch between Light, Dark, or System default themes.
- **Visual Styles**: Adjust how your bookmarks are displayed.

### Installing as an App (PWA)
You can install NECS Bookmarks directly to your home screen or desktop:
1. Open the app in your browser.
2. Look for the "Install" icon in the address bar or select "Add to Home Screen" from your browser menu.

## 🔒 Your Privacy
NECS Bookmarks is designed with privacy in mind. All your data is processed and stored locally on your device, ensuring that your browsing habits and link collections remain private.

---

## 🛠 Developer Architecture

Welcome to the technical design and architectural documentation of NECS Bookmarks. This section is designed for developers who want to extend, maintain, or debug the system.

### 📁 Folder Structure

The project is structured as a modular React SPA with auxiliary JavaScript utility libraries:

```text
├── css/                   # Stylesheet definitions
│   └── style.css          # Core CSS stylesheet
├── data/                  # Static seeded bookmark data
│   ├── necs_cat.json      # Categories seed configuration
│   └── necs_links.json    # Bookmarks seed collection
├── public/                # Static public assets and service workers
├── src/                   # Main source code
│   ├── components/        # Reusable React components
│   │   ├── BookmarkCard.jsx      # Individual interactive bookmark element
│   │   ├── Sidebar.jsx           # Desktop navigation and theme switcher
│   │   ├── TabBar.jsx            # Mobile tab bar navigation
│   │   ├── BookmarksView.jsx     # Main grid containing lists and categories
│   │   ├── ManualStatsView.jsx   # HTMX-powered Analytics / Diagnostics page
│   │   └── SettingsModal.jsx     # Core settings config panel
│   ├── utils/             # Independent core logical modules (RAG, Math, Astronomy)
│   │   ├── dataAnalysis.js       # Outlier/anomaly detection and data quality suites
│   │   ├── panchangam.js         # Telugu Panchangam astronomical calculations
│   │   ├── regexGen.js           # Lexer / parser to build robust regexes
│   │   ├── storage.js            # Safe wrapper around LocalStorage
│   │   └── textSplitter.js       # RAG context document splitter
│   ├── App.jsx            # Parent root layout and global state controller
│   └── main.jsx           # App initialization, service-worker register, and entry-point
└── tests/                 # Playwright test suite (smoke & utility validation)
```

### 🧩 Component State Management & Life-Cycle

NECS Bookmarks relies on React's native state-hook pattern consolidated at the parent level (`App.jsx`) to enforce a single source of truth:

1. **Global Settings Synchronization**: Setting variables (e.g., compaction, animations, theme mode, accent colors, custom app titles) are managed using the custom `useLocalStorageState` hooks. Whenever configuration state changes, it automatically serializes to localStorage and updates HTML attributes (`data-theme`, `data-color`) in real-time.
2. **Background Data Integration**: Upon component mount, `App.jsx` triggers a silent automated comparison background run between the offline seed dataset (`necs_links.json`) and the browser's persistent state. Missing entries or updated source properties are seamlessly patched into LocalStorage, triggering a render update without replacing user modifications.
3. **Responsive Visual Branching**:
   - For viewports **under 768px**, a top `Header` navigation and bottom `TabBar` are visible.
   - For viewports **over 768px**, the elements are hidden, and a stationary multi-purpose `Sidebar` becomes the primary navigation, live-search, and theme selection mechanism.

### ⚙️ Utility Modules

The application includes four highly optimized standalone utilities located in `src/utils/`:

- **Data Quality Engine & Anomaly Detection (`dataAnalysis.js`)**: Ported from Python's statistical stack (`Scikit-Learn` and `Great Expectations`). It evaluates multidimensional data arrays via Mahalanobis Distance for multivariate outlier detection and assesses statistical null-deviations.
- **Astronomical Telugu Panchangam (`panchangam.js`)**: Calculates Julian dates, Ayanamsa corrections, solar/lunar longitudes, sunrise/sunset times, and Telugu planetary indicators based on geographic coordinates.
- **Heuristic Pattern Builder (`regexGen.js`)**: Ported from Java implementations to analyze raw text structures (alphabets, cases, numbers, layouts) and compile exact regular expression structures.
- **LangChain-inspired Text Splitter (`textSplitter.js`)**: Implementation of `RecursiveCharacterTextSplitter` which recursively chunk-splits long document inputs using a prioritization of separators (`\n\n`, `\n`, space) and custom overlap margins.
