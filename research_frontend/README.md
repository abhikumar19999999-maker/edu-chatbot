# EduBot Research Frontend

Simple React + Vite frontend for the research-paper-aligned EduBot API.

## Local

```bash
npm install
npm run dev
```

Create `.env`:

```env
VITE_API_URL=http://localhost:8000
```

For deployment, set `VITE_API_URL` to the deployed FastAPI URL and use `npm run build` as the build command. Publish the `dist` directory as a static site.