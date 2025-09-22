# Traffid Projects - Deployment Guide

## Deployment Options for Your Domain

### Option 1: Replit Deployments (Recommended for Quick Setup)

**Steps:**
1. In your Replit project, click the "Deploy" button in the top navigation
2. Choose "Autoscale Deployment" for production use
3. Configure your custom domain:
   - Go to deployment settings
   - Add your domain (e.g., projects.traffid.ai)
   - Follow DNS configuration instructions
4. Set environment variables in deployment settings:
   - `DATABASE_URL` (your PostgreSQL connection string)
   - `SESSION_SECRET` (secure random string)
   - `REPLIT_DOMAINS` (your custom domain)
   - `NODE_ENV=production`

**Pros:**
- Automatic SSL certificates
- Built-in scaling and monitoring
- Simple deployment process
- Integrated with your development environment

**Cost:** Starting at $7/month for basic deployment

### Option 2: VPS/Cloud Server Deployment

**Requirements:**
- Ubuntu/Linux server (DigitalOcean, Linode, AWS EC2, etc.)
- Node.js 18+ installed
- PostgreSQL database
- Nginx for reverse proxy
- Domain pointing to your server IP

**Deployment Steps:**

#### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install Nginx
sudo apt install nginx

# Install PM2 for process management
sudo npm install -g pm2
```

#### 2. Database Setup
```bash
# Create database and user
sudo -u postgres psql
CREATE DATABASE traffid_projects;
CREATE USER traffid_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE traffid_projects TO traffid_user;
\q
```

#### 3. Application Deployment
```bash
# Clone your code (or upload via SCP/SFTP)
git clone [your-repository-url] /var/www/traffid-projects
cd /var/www/traffid-projects

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
nano .env
# Add your production environment variables:
# DATABASE_URL=postgresql://traffid_user:your_secure_password@localhost:5432/traffid_projects
# SESSION_SECRET=your_very_secure_random_string
# REPLIT_DOMAINS=projects.traffid.ai
# NODE_ENV=production

# Build the application
npm run build

# Set up database schema
npm run db:push

# Start with PM2
pm2 start npm --name "traffid-projects" -- start
pm2 save
pm2 startup
```

#### 4. Nginx Configuration
```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/traffid-projects
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name projects.traffid.ai;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/traffid-projects /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d projects.traffid.ai
```

### Option 3: Docker Deployment

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Build the application
RUN npm run build

EXPOSE 5000

# Start the application
CMD ["npm", "start"]
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/traffid_projects
      - SESSION_SECRET=your_secure_session_secret
      - REPLIT_DOMAINS=projects.traffid.ai
      - NODE_ENV=production
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=traffid_projects
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Option 4: Vercel/Netlify (Static + Serverless)

**Note:** This requires some modifications to separate frontend and backend

**Steps:**
1. Separate the React frontend from Express backend
2. Deploy frontend to Vercel/Netlify
3. Deploy backend to a serverless platform (Vercel Functions, Netlify Functions)
4. Update API endpoints to point to serverless functions

### Option 5: AWS/Google Cloud/Azure

**AWS Example using Elastic Beanstalk:**
1. Install AWS CLI and EB CLI
2. Initialize Elastic Beanstalk application
3. Configure RDS PostgreSQL instance
4. Deploy using `eb deploy`
5. Configure custom domain through Route 53

## DNS Configuration

**For any deployment option, configure your DNS:**

1. **A Record**: Point your domain to your server's IP address
   ```
   Type: A
   Name: projects (or @)
   Value: YOUR_SERVER_IP
   TTL: 3600
   ```

2. **CNAME Record** (if using subdomains):
   ```
   Type: CNAME
   Name: projects
   Value: traffid.ai
   TTL: 3600
   ```

## Environment Variables Required

```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database_name

# Session Security
SESSION_SECRET=your_very_secure_random_string_here

# Domain Configuration
REPLIT_DOMAINS=projects.traffid.ai

# Environment
NODE_ENV=production

# OAuth Configuration (if needed)
ISSUER_URL=https://replit.com/oidc
```

## Production Checklist

- [ ] SSL certificate installed and working
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Application building and starting correctly
- [ ] Domain pointing to correct IP/service
- [ ] Firewall configured (ports 80, 443 open)
- [ ] Database backups configured
- [ ] Monitoring set up (optional but recommended)
- [ ] Log rotation configured

## Monitoring and Maintenance

**Recommended tools:**
- **Uptime monitoring**: UptimeRobot, Pingdom
- **Error tracking**: Sentry
- **Performance monitoring**: New Relic, DataDog
- **Log management**: LogDNA, Papertrail

## Cost Estimates

- **Replit Deployment**: $7-20/month
- **VPS (DigitalOcean/Linode)**: $5-20/month
- **AWS/Google Cloud**: $10-50/month (varies by usage)
- **Domain registration**: $10-15/year

## Support

If you need help with deployment:
1. Choose your preferred deployment method
2. Follow the specific steps for that option
3. Test the deployment thoroughly
4. Configure monitoring and backups

Each option has different complexity levels and costs. Replit Deployments is the simplest, while VPS gives you more control.