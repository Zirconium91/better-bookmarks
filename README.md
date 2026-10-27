# Better Bookmarks

**Your links, a little calmer.**

Better Bookmarks is a personal start page for organising bookmarks into movable cards, with a GNOME-inspired interface and an animated wave background. It uses separate HTML, CSS, and JavaScript files, with no build step, account, or backend.

## Features

- **Grouped bookmarks:** organise links into named categories.
- **Bookmark editing:** update a link's name, URL, or category without deleting it.
- **Movable sections:** drag a section heading or use its arrow buttons to change the card order.
- **Automatic saving:** bookmarks, section order, and preferences persist in your browser.
- **Light and dark themes:** switch themes and choose from nine accent colours.
- **Animated wallpaper:** choose Slow, Medium, or Fast wave motion.
- **Optional dialog blur:** disable the blur effect in Settings.
- **Web search:** search DuckDuckGo directly from the dashboard.
- **Keyboard shortcut:** press `/` or `Ctrl+K` outside an input or dialog to focus search.
- **Reduced-motion support:** the wallpaper stays still when your system requests reduced motion.

## Getting started

1. Download and extract the project ZIP, or clone this repository.
2. Keep `index.html`, `styles.css`, and `app.js` together in a permanent folder.
3. Open `index.html` in a modern browser with JavaScript enabled.
4. Click **+** to add your first bookmark.

There are no packages to install. The dashboard itself works offline; opening websites and searching the web require a connection.

You can bookmark the dashboard for quick access. It is a standalone page, not a browser extension, and does not automatically replace your browser's new-tab page.

> If your downloaded HTML has a different filename, use that file instead. Once you have added bookmarks, keep its name and location stable: moving or renaming a locally opened file can affect access to its saved data.

## Using Better Bookmarks

| Action | How |
| --- | --- |
| Add a bookmark | Click **+**, enter a name, full URL, and category, then save. |
| Edit a bookmark | Click **✎** beside the link. Change its category to move it to another card. |
| Delete a bookmark | Click **×** beside the link and confirm. |
| Reorder cards | Drag a card's heading onto another card, or use **← / →**. The arrows also work with touch and keyboard navigation. |
| Change appearance | Open **Settings** to choose an accent, wallpaper speed, or blur preference. |
| Switch theme | Click the sun or moon button in the header. |
| Search the web | Type in the search bar and press Enter. Results open in a new tab. |

Categories appear when they contain bookmarks and disappear when their final bookmark is removed. Section order is saved automatically.

## Storage and privacy

Better Bookmarks stores data as JSON or text in the browser's `localStorage`:

| Key | Stored data |
| --- | --- |
| `dashboard-bookmarks-v2` | Bookmark names, URLs, and categories |
| `dashboard-group-order-v1` | Section order |
| `dashboard-settings-v1` | Wallpaper speed, accent colour, and blur preference |
| `theme` | Light or dark theme |

Bookmarks are **not embedded in the HTML file**. Publishing this source code to GitHub does not upload the bookmarks you added through the interface. A new user's dashboard starts empty.

The dashboard has no analytics, external scripts, or bookmark-upload service. Search queries are sent to DuckDuckGo when you submit them, and opening a bookmark visits its destination normally.

### Storage limitations

- Data belongs to the browser profile and page storage context; it does not sync between devices or browsers.
- Clearing site data or resetting your browser profile can remove your bookmarks and preferences.
- Private browsing storage is generally temporary.
- Storage behaviour for locally opened `file://` pages varies between browsers. Moving the file or switching to a hosted URL may give the page a separate storage area.
- There is currently no built-in export, import, or backup feature.
- Better Bookmarks's bookmarks are separate from your browser's native bookmark manager.

## Performance

Better Bookmarks uses plain HTML, CSS, and JavaScript, with no framework or runtime dependencies. The wallpaper uses a canvas with a capped pixel budget and targets up to 30 drawn frames per second. Animation pauses while the tab is hidden or a settings/bookmark dialog is open, and respects reduced-motion preferences.

Bookmark actions share event handlers. Reordering cards moves existing elements instead of rebuilding their bookmark rows. Adding, editing, or deleting bookmarks currently rebuilds the dashboard.

The wallpaper still performs continuous rendering while active; its cost depends on screen size, browser, and hardware. The speed selector changes motion speed, not the frame-rate target.

## Development

| File | Responsibility |
| --- | --- |
| `index.html` | Page structure, forms, and settings controls |
| `styles.css` | Layout, themes, colours, and component styles |
| `app.js` | Bookmark storage, editing, card ordering, settings, and wallpaper animation |

Edit the relevant file in a text editor, then reload the HTML page in your browser. The JavaScript applies the saved theme early and waits for the page markup before initialising the dashboard.

### Updating from the single-file version

For a fresh installation, open `index.html`. If you already have saved bookmarks, rename the downloaded `index.html` to your existing HTML filename and replace that file at its original location. Place `styles.css` and `app.js` beside it. The storage keys are unchanged. Keep a copy of the original file before replacing it. Opening the extracted project from a different location may use a different browser storage context.

No build command or package manager is required.
