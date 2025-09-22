# React Live2D Cubism Starter

Demo-https://live2d-model-react.netlify.app/

**React + Vite starter with Live2D Cubism SDK integration.**  
Bring Live2D `.model3.json` characters into your React apps with a ready-to-use `<Live2DCharacter />` component.

---

## Features

- Minimal Live2D loader (`live2dLoader.jsx`) for `.model3.json`, `.moc3`, and textures
- React `<Live2DCharacter />` component with `<canvas>` rendering
- Hot-swappable models
- Works out of the box with Vite
- Example sample model included

---

## Installation

```bash
npm install
npm run dev
# open the URL Vite prints (e.g., http://localhost:5173)
```

---

## Usage

`src/App.jsx` example:

```jsx
import Live2DCharacter from './components/Live2DCharacter/Live2DCharacter.jsx'

export default function App() {
  return (
    <Live2DCharacter modelPath="/assets/live2d/pachirisu/pachirisu-anime-girl-top-half.model3.json" />
  )
}
```

> **Note:** Filenames currently include spaces; paths must match exactly. Consider renaming files and updating the `.model3.json` accordingly.

---

## Adding a new model

1. Copy your model folder into `public/assets/live2d/<your-model>/` including `.model3.json`, `.moc3`, textures, physics, etc.
2. Pass the `.model3.json` URL to the component:
   ```jsx
   <Live2DCharacter modelPath="/assets/live2d/your-model/your-model.model3.json" />
   ```
3. Keep paths consistent with filenames or rename files and update `.model3.json` references.

---

## Project Structure

- `index.html` – loads Cubism Core and boots Vite app
- `public/assets/live2d/` – models and SDK Core files
- `src/live2d/**` – Cubism Framework sources (TypeScript moved from SDK)
- `src/components/Live2DCharacter/**` – React component, loader, styles

---

## Live2D Integration Details

- Core loaded via script in `index.html`:

```html
<script src="/assets/live2d/sdk/Core/live2dcubismcore.js"></script>
```

- Loader flow:
  - `CubismFramework.startUp()` → `CubismFramework.initialize()`
  - Load `.moc3`, bind textures, create `CubismUserModel` renderer
  - Per frame: `renderer.drawModel()`

---

## Troubleshooting

- **404 model/texture:** Verify `modelPath` and texture paths inside `.model3.json`. Rename or URL-encode paths if needed.  
- **WebGL not available:** Ensure the browser supports WebGL and no extensions block it.  
- **Hot-reload issues:** If modifying `src/live2d` files, refresh if types change.

---

## Credits

- **Model Artist:** [Koahri](https://twitter.com/koahri1)  
- **Repo Creator / Maintainer:** Akhil

---

## License

MIT License. See `LICENSE` for details.
