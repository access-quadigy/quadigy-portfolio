Cloudways deploy (same domain)

Goal
- React frontend served on your domain
- Node API available on same domain at /api
- MySQL stores products permanently

Admin login
Username: quadigy
Password: quadigy@2018
Admin path: /admin/dash

1) Database
- Create MySQL database and user on Cloudways
- Import database.sql using Database Manager (or phpMyAdmin)

2) Backend
- Upload backend/ folder to server (for example: /home/master/applications/APPID/private_html/backend)
- SSH into backend folder
  npm install
  cp .env.example .env
  Fill DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
  Start with PM2:
  pm2 start server.js --name quadigy-api

3) Reverse proxy /api (same domain)
- Add Nginx/Apache rule to proxy /api to Node port (5000)
  Cloudways support can add this, or use Application Settings if available.

4) Frontend
- Upload frontend/ folder
- Build:
  npm install
  cp .env.example .env
  npm run build
- Upload build/ contents to public_html

Local run
Frontend:
- cd frontend
- cp .env.example .env
- npm install
- npm start
Backend:
- cd backend
- cp .env.example .env
- npm install
- npm start
