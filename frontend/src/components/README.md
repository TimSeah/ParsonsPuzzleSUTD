# Components

| Folder | Contents |
| --- | --- |
| `ui/` | Shared building blocks: `Dialog`, `LoadingState`, `StatusIndicator`, `DictionaryModal`, `ThemeToggle` |
| `puzzle/` | The puzzle board (`PuzzleDisplay`), proof steps and validation feedback |
| `layout/` | Puzzle settings panel / mobile sheet |
| `navigation/` | Header and mobile tab bar |
| `educator/` | Puzzle creator and its category list |
| `renderers/` | `KatexRenderer`, including the clickable symbol placeholders |

Tests sit next to the component (`Name.test.jsx`). Shared classes (`.btn`, `.card`, `.segmented`, ...) are in `src/styles/ui.css`.

Use the `--color-*` tokens from `src/index.css` instead of hard-coded colours, so components work in both the light and dark themes.
