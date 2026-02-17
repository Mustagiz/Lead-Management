# Deployment Guide - Lead Management System

## Table of Contents
1. [Development Setup](#development-setup)
2. [Production Deployment](#production-deployment)
3. [Backend Setup](#backend-setup)
4. [Database Configuration](#database-configuration)
5. [Environment Configuration](#environment-configuration)
6. [Deployment Options](#deployment-options)

---

## Development Setup

### Prerequisites
- Node.js 16+ and npm
- Git
- Code editor (VS Code recommended)
- MongoDB (local or cloud)

### Local Development

1. **Clone or download the project files**

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm start
```

4. **Access the application**
   - Open browser to `http://localhost:3000`
   - Login with demo credentials

### Project Structure
```
lead-management-app/
├── public/
│   └── index.html
├── src/
│   ├── lead-management-app.jsx (main component)
│   └── index.js
├── package.json
├── README.md
├── USER_GUIDE.md
├── sample_leads.csv
├── backend-api-example.js
├── .env.example
└── DEPLOYMENT.md
```

---

## Production Deployment

### Step 1: Build the Application

```bash
# Install dependencies
npm install

# Create production build
npm run build
```

This creates an optimized build in the `build/` directory.

### Step 2: Environment Variables

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Update the values for production:
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/leadmanagement
JWT_SECRET=your-strong-secret-key-here
FRONTEND_URL=https://yourdomain.com
```

### Step 3: Security Checklist

✅ Change default admin password
✅ Use strong JWT secret
✅ Enable HTTPS
✅ Set up CORS properly
✅ Use environment variables
✅ Enable rate limiting
✅ Set up database backups
✅ Configure logging

---

## Backend Setup

### Installing Backend Dependencies

```bash
npm install express mongoose bcryptjs jsonwebtoken cors dotenv
npm install --save-dev nodemon
```

### Running the Backend

**Development:**
```bash
node backend-api-example.js
```

Or with nodemon for auto-restart:
```bash
npx nodemon backend-api-example.js
```

**Production:**
```bash
NODE_ENV=production node backend-api-example.js
```

### Backend API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

#### Leads
- `GET /api/leads` - Get leads (filtered by role)
- `POST /api/leads` - Create single lead
- `POST /api/leads/bulk` - Bulk upload leads
- `PATCH /api/leads/:id/status` - Update lead status
- `PATCH /api/leads/bulk-status` - Bulk update status

#### Users (Admin only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `PATCH /api/users/:id` - Update user
- `PATCH /api/users/:id/password` - Reset password
- `DELETE /api/users/:id` - Delete user

#### Statistics
- `GET /api/stats` - Get role-based statistics

---

## Database Configuration

### MongoDB Atlas (Recommended for Production)

1. **Create a MongoDB Atlas account**
   - Go to https://www.mongodb.com/cloud/atlas
   - Create free cluster

2. **Configure network access**
   - Add your IP address
   - Or allow access from anywhere (0.0.0.0/0)

3. **Create database user**
   - Create with read/write permissions
   - Save username and password

4. **Get connection string**
   - Click "Connect"
   - Choose "Connect your application"
   - Copy connection string
   - Replace `<password>` with your password

5. **Update .env file**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/leadmanagement?retryWrites=true&w=majority
```

### Local MongoDB

1. **Install MongoDB**
   - Download from https://www.mongodb.com/try/download/community
   - Install and start service

2. **Start MongoDB**
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

3. **Configure connection**
```env
MONGODB_URI=mongodb://localhost:27017/leadmanagement
```

---

## Deployment Options

### Option 1: Vercel (Frontend + Supabase)

1. **Connect Repository**: Import your GitHub repository into Vercel.
2. **Environment Variables**: Add the following in the Vercel Dashboard:
   - `REACT_APP_SUPABASE_URL`: Your Supabase Project URL
   - `REACT_APP_SUPABASE_ANON_KEY`: Your Supabase Anon Key
3. **Database Setup**: Ensure you've run the SQL migration script in the Supabase SQL Editor.
4. **Deploy**: Click Deploy.

Note: No separate backend is required as we are using Supabase's client-side SDK.

### Option 2: Heroku (Full Stack)

#### Frontend Deployment

1. **Create Heroku app**
```bash
heroku create your-app-name
```

2. **Add buildpack**
```bash
heroku buildpacks:set heroku/nodejs
```

3. **Deploy**
```bash
git push heroku main
```

#### Backend Deployment

1. **Create separate app for backend**
```bash
heroku create your-app-name-api
```

2. **Add MongoDB add-on**
```bash
heroku addons:create mongolab:sandbox
```

3. **Set environment variables**
```bash
heroku config:set JWT_SECRET=your-secret-key
heroku config:set NODE_ENV=production
```

4. **Deploy backend**
```bash
git push heroku main
```

### Option 3: DigitalOcean (VPS)

1. **Create Droplet**
   - Ubuntu 20.04 LTS
   - At least 1GB RAM

2. **SSH into server**
```bash
ssh root@your-server-ip
```

3. **Install Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

4. **Install MongoDB**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

5. **Clone and setup application**
```bash
git clone your-repo-url
cd lead-management-app
npm install
npm run build
```

6. **Install PM2 for process management**
```bash
sudo npm install -g pm2
pm2 start backend-api-example.js --name lead-api
pm2 startup
pm2 save
```

7. **Setup Nginx as reverse proxy**
```bash
sudo apt install nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/leadmanager

# Add configuration:
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/build;
        try_files $uri /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/leadmanager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

8. **Setup SSL with Let's Encrypt**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Option 4: AWS (Enterprise Scale)

#### Using AWS Elastic Beanstalk

1. **Install EB CLI**
```bash
pip install awsebcli
```

2. **Initialize EB application**
```bash
eb init -p node.js lead-management-app
```

3. **Create environment**
```bash
eb create lead-management-env
```

4. **Deploy**
```bash
eb deploy
```

5. **Configure environment variables**
```bash
eb setenv JWT_SECRET=your-secret MONGODB_URI=your-mongo-url
```

#### Using AWS EC2 + RDS

1. Launch EC2 instance (t2.micro for testing)
2. Setup MongoDB on DocumentDB or EC2
3. Configure Security Groups
4. Follow similar steps as DigitalOcean setup

---

## Post-Deployment Steps

### 1. Test the Application

✅ Login with default credentials
✅ Create a test employee account
✅ Upload sample leads
✅ Test QA workflow
✅ Test admin functions
✅ Verify all filters work
✅ Test CSV export

### 2. Security Hardening

```bash
# Update all packages
npm audit fix

# Set secure headers in backend
npm install helmet
```

Add to backend:
```javascript
const helmet = require('helmet');
app.use(helmet());
```

### 3. Monitoring Setup

**Install logging:**
```bash
npm install winston morgan
```

**Setup monitoring:**
- Application: New Relic, Datadog, or PM2 monitoring
- Database: MongoDB Atlas monitoring
- Uptime: UptimeRobot or Pingdom

### 4. Backup Strategy

**Database Backups:**
```bash
# MongoDB backup script
mongodump --uri="mongodb://localhost:27017/leadmanagement" --out=/backup/$(date +%Y%m%d)

# Automated daily backups
crontab -e
# Add: 0 2 * * * /path/to/backup-script.sh
```

**File Backups:**
- Setup automated backups to S3 or similar
- Implement version control for code

---

## Performance Optimization

### 1. Enable Caching

```javascript
// Add to backend
const redis = require('redis');
const client = redis.createClient();

// Cache frequently accessed data
app.get('/api/stats', async (req, res) => {
  const cached = await client.get('stats');
  if (cached) return res.json(JSON.parse(cached));
  
  // Fetch and cache
  const stats = await getStats();
  await client.setex('stats', 300, JSON.stringify(stats));
  res.json(stats);
});
```

### 2. Database Indexing

```javascript
// Add indexes to improve query performance
leadSchema.index({ employeeId: 1, date: -1 });
leadSchema.index({ status: 1 });
leadSchema.index({ email: 1 });
userSchema.index({ username: 1 }, { unique: true });
```

### 3. Frontend Optimization

- Enable gzip compression
- Implement lazy loading
- Use CDN for static assets
- Minimize bundle size

---

## Troubleshooting

### Common Issues

**Issue: Cannot connect to MongoDB**
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check connection string
echo $MONGODB_URI

# Test connection
mongo "mongodb://localhost:27017/leadmanagement"
```

**Issue: API requests failing**
```bash
# Check backend logs
pm2 logs lead-api

# Check if backend is running
pm2 status

# Restart backend
pm2 restart lead-api
```

**Issue: Build fails**
```bash
# Clear cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## Support & Maintenance

### Regular Tasks

**Daily:**
- Monitor error logs
- Check system health

**Weekly:**
- Review user feedback
- Database backup verification
- Security updates

**Monthly:**
- Performance review
- Dependency updates
- User access audit

---

## Scaling Considerations

### Horizontal Scaling
- Use load balancer (AWS ELB, Nginx)
- Deploy multiple backend instances
- Implement session sharing (Redis)

### Database Scaling
- Enable MongoDB replication
- Consider sharding for large datasets
- Use read replicas

### Cost Optimization
- Use CDN for static assets
- Implement caching strategy
- Monitor and optimize queries
- Auto-scaling for traffic patterns

---

**Document Version**: 1.0  
**Last Updated**: February 2026
