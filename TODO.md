# TODO — AGRAJA SANGAM Deployment Preparation

## Backend (Render)
- [ ] 1. server.js — bind `0.0.0.0`, keep `process.env.PORT || 5000`
- [ ] 2. server.js — update CORS to allow FRONTEND_URL + localhost dev origins
- [ ] 3. Create `server/.env.example` (variable names only)
- [ ] 4. Fix receipt-number duplicate collision in `receiptController.js`

## Frontend (Vercel)
- [ ] 5. Create `client/src/utils/apiConfig.js` (centralized API base from `VITE_API_URL`)
- [ ] 6. Update all `client/src/api/*.js` to use centralized apiConfig
- [ ] 7. Create `client/.env.example`
- [ ] 8. Create `client/vercel.json` for SPA rewrites
- [ ] 9. Update `client/index.html` title

## Root / Repo
- [ ] 10. Create root `.gitignore`
- [ ] 11. Create `DEPLOYMENT.md`

## Verification
- [ ] 12. Frontend `npm install` + `npm run build`
- [ ] 13. Backend syntax check (`node -c server.js`)
