# NECS Hub

![NECS Hub Icon](./perchance.png)

A personal dashboard to organize and access your favorite websites.

## Features

- **Categorized View**: Links are automatically grouped by categories like AI, Productivity, Media, Social, and Streaming.
- **Search**: Real-time filtering by title or URL.
- **Local Storage**: Your changes (adding, editing, deleting links) are saved locally in your browser (`necs_hub_links_v1`), so they persist across sessions.
- **Dark/Light Mode**: Toggle between themes based on your preference.
- **Responsive Design**: Works on desktop and mobile devices.
- **Import/Export**: Backup your links to a JSON file and restore them later.
- **Privacy Focused**: No external tracking; everything runs locally.

## Getting Started

1. **Open the Dashboard**: Simply open `index.html` in your web browser.
2. **Initial Data**: The app loads initial data from `necs_links.json`.
3. **Customize**:
   - Click the **+** button to add new tools.
   - Use the edit/delete buttons on cards to manage your tools.
   - Toggle the theme using the moon/sun icon in the top bar.

## File Structure

- `index.html`: The main entry point for the application.
- `hub.js`: Contains all the logic for the dashboard, including state management and UI rendering.
- `style.css`: Styles for the application.
- `necs_links.json`: The default list of links used to populate the dashboard if no local data is found.

## Customization

You can manually edit `necs_links.json` to change the default set of links that load for a new user (or if you clear your local storage).

Modify the `necs_links.json` file with the following structure:

```json
[
  {
    "title": "Example Title",
    "url": "https://example.com",
    "optional_icon": "https://example.com/favicons/favicon.ico",
    "urls": ["multiple urls separated by comma"],
    "category": "Utilities"
  }
]
```
