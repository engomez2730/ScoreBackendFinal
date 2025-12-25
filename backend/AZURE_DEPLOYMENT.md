# Azure Deployment Guide for Basketball Stats API

## Prerequisites
1. Azure account with active subscription
2. Azure CLI installed locally
3. Git installed locally

## Deployment Steps

### 1. Prepare the Application

The application is already configured with:
- ✅ Dynamic PORT configuration (reads from process.env.PORT)
- ✅ PostgreSQL database configured
- ✅ CORS enabled for cross-origin requests
- ✅ Web.config for Azure IIS
- ✅ Production-ready scripts

### 2. Create Azure Web App

```bash
# Login to Azure
az login

# Create a resource group (if not exists)
az group create --name basketball-stats-rg --location eastus

# Create an App Service plan
az appservice plan create --name basketball-stats-plan --resource-group basketball-stats-rg --sku B1 --is-linux

# Create the Web App
az webapp create --resource-group basketball-stats-rg --plan basketball-stats-plan --name basketball-stats-api --runtime "NODE:18-lts"
```

### 3. Configure Environment Variables

Set these application settings in Azure Portal or via CLI:

```bash
az webapp config appsettings set --resource-group basketball-stats-rg --name basketball-stats-api --settings \
  DATABASE_URL="postgresql://postgres:Elsa273014!@postgres273014.postgres.database.azure.com:5432/Score?connect_timeout=10&sslmode=prefer" \
  JWT_SECRET="your-super-secret-jwt-key-change-this-in-production" \
  NODE_ENV="production" \
  WEBSITE_NODE_DEFAULT_VERSION="18-lts" \
  SCM_DO_BUILD_DURING_DEPLOYMENT="true"
```

### 4. Deploy Using Git

```bash
# Initialize git repository (if not already)
cd backend
git init

# Add Azure remote
az webapp deployment source config-local-git --name basketball-stats-api --resource-group basketball-stats-rg

# Get deployment credentials
az webapp deployment list-publishing-credentials --name basketball-stats-api --resource-group basketball-stats-rg --query scmUri --output tsv

# Add files and commit
git add .
git commit -m "Initial deployment"

# Push to Azure
git remote add azure <deployment-url-from-above>
git push azure main:master
```

### 5. Alternative: Deploy Using VS Code

1. Install "Azure App Service" extension in VS Code
2. Sign in to Azure
3. Right-click on the backend folder
4. Select "Deploy to Web App"
5. Choose your subscription and Web App
6. Confirm deployment

### 6. Alternative: Deploy Using GitHub Actions

Create `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy to Azure Web App

on:
  push:
    branches:
      - main

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: npm install and build
        run: |
          cd backend
          npm install
          npx prisma generate
          
      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v2
        with:
          app-name: 'basketball-stats-api'
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: ./backend
```

### 7. Configure Startup Command

In Azure Portal:
1. Go to Configuration > General settings
2. Set Startup Command: `node src/index.js`
3. Save

Or via CLI:
```bash
az webapp config set --resource-group basketball-stats-rg --name basketball-stats-api --startup-file "node src/index.js"
```

### 8. Enable WebSockets (for Socket.IO)

```bash
az webapp config set --resource-group basketball-stats-rg --name basketball-stats-api --web-sockets-enabled true
```

### 9. Run Database Migrations

After first deployment:
```bash
# SSH into Azure Web App or use Azure CLI
az webapp ssh --resource-group basketball-stats-rg --name basketball-stats-api

# Then run:
npx prisma generate
npx prisma db push
```

### 10. Verify Deployment

Your API will be available at:
- `https://basketball-stats-api.azurewebsites.net/api`

Test endpoints:
- `https://basketball-stats-api.azurewebsites.net/api` - Health check
- `https://basketball-stats-api.azurewebsites.net/api/teams` - Get teams
- `https://basketball-stats-api.azurewebsites.net/api/auth/login` - Login

## Environment Variables Needed

```
DATABASE_URL=postgresql://postgres:Elsa273014!@postgres273014.postgres.database.azure.com:5432/Score?connect_timeout=10&sslmode=prefer
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=production
PORT=8080
```

## Monitoring and Logs

View logs:
```bash
az webapp log tail --resource-group basketball-stats-rg --name basketball-stats-api
```

Or in Azure Portal: 
- App Service > Monitoring > Log stream

## Troubleshooting

1. **Application doesn't start**: Check startup command and logs
2. **Database connection fails**: Verify DATABASE_URL and Azure PostgreSQL firewall rules
3. **WebSocket issues**: Ensure web sockets are enabled in App Service configuration
4. **CORS errors**: Verify CORS settings in src/index.js match your frontend URL

## Production Checklist

- ✅ Change JWT_SECRET to a secure random string
- ✅ Set NODE_ENV to "production"
- ✅ Configure Azure PostgreSQL firewall to allow Azure services
- ✅ Enable Application Insights for monitoring
- ✅ Set up custom domain (optional)
- ✅ Enable SSL/HTTPS (automatic with azurewebsites.net)
- ✅ Configure auto-scaling if needed
- ✅ Set up backup strategy for database

## Cost Optimization

- Start with B1 (Basic) tier: ~$13/month
- Upgrade to S1 (Standard) if you need:
  - Auto-scaling
  - Custom domains with SSL
  - Staging slots
  - Daily backups

## Security Notes

1. Never commit .env file to git
2. Use Azure Key Vault for sensitive credentials
3. Enable managed identity for database access
4. Configure Azure PostgreSQL firewall rules
5. Use Application Insights for security monitoring
