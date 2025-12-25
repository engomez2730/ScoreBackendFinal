# Basketball Stats API - Azure Deployment

This application is configured for deployment to Azure App Service.

## Quick Deploy to Azure

### Option 1: Azure Portal (Easiest)

1. Go to [Azure Portal](https://portal.azure.com)
2. Create a new **Web App**:
   - **Name**: basketball-stats-api (or your preferred name)
   - **Runtime**: Node 18 LTS
   - **Region**: East US (or your preferred region)
   - **Plan**: Basic B1 or higher
3. After creation, go to **Configuration** > **Application settings**
4. Add these settings:
   ```
   DATABASE_URL: postgresql://postgres:Elsa273014!@postgres273014.postgres.database.azure.com:5432/Score?connect_timeout=10&sslmode=prefer
   JWT_SECRET: your-secure-secret-key
   NODE_ENV: production
   ```
5. Go to **Configuration** > **General settings**
   - Startup Command: `node src/index.js`
   - Enable Web Sockets: ON
6. Go to **Deployment Center**
   - Choose deployment source (Local Git, GitHub, etc.)
   - Follow the wizard

### Option 2: Azure CLI (Fast)

```bash
# Login
az login

# Create resource group
az group create --name basketball-rg --location eastus

# Create App Service Plan
az appservice plan create --name basketball-plan --resource-group basketball-rg --sku B1 --is-linux

# Create Web App
az webapp create --resource-group basketball-rg --plan basketball-plan --name basketball-stats-api --runtime "NODE:18-lts"

# Configure app settings
az webapp config appsettings set --resource-group basketball-rg --name basketball-stats-api --settings DATABASE_URL="postgresql://postgres:Elsa273014!@postgres273014.postgres.database.azure.com:5432/Score?connect_timeout=10&sslmode=prefer" JWT_SECRET="change-this-secret" NODE_ENV="production"

# Enable WebSockets
az webapp config set --resource-group basketball-rg --name basketball-stats-api --web-sockets-enabled true

# Set startup command
az webapp config set --resource-group basketball-rg --name basketball-stats-api --startup-file "node src/index.js"

# Deploy (from backend folder)
cd backend
zip -r deploy.zip .
az webapp deployment source config-zip --resource-group basketball-rg --name basketball-stats-api --src deploy.zip
```

### Option 3: VS Code Extension (Interactive)

1. Install **Azure App Service** extension in VS Code
2. Sign in to Azure (Ctrl+Shift+P > Azure: Sign In)
3. Right-click on `backend` folder
4. Select **Deploy to Web App**
5. Follow the prompts

## After Deployment

1. **Initialize Database**:
   ```bash
   # SSH into your app
   az webapp ssh --resource-group basketball-rg --name basketball-stats-api
   
   # Run migrations
   cd /home/site/wwwroot
   npx prisma db push
   node create-admin.js
   node create-test-data.js
   ```

2. **Test Your API**:
   - Health: `https://basketball-stats-api.azurewebsites.net/api`
   - Teams: `https://basketball-stats-api.azurewebsites.net/api/teams`

## Configuration Files

- ✅ `web.config` - IIS configuration for Azure
- ✅ `.gitignore` - Git ignore patterns
- ✅ `package.json` - Updated with engines and build scripts
- ✅ `.env.production` - Production environment template
- ✅ `AZURE_DEPLOYMENT.md` - Detailed deployment guide

## Important Notes

1. **Database Connection**: Already configured for Azure PostgreSQL
2. **Port**: Automatically uses `process.env.PORT` (Azure default: 8080)
3. **WebSockets**: Must be enabled for Socket.IO real-time features
4. **CORS**: Currently allows all origins (`*`) - update in production if needed

## Estimated Costs

- **B1 Basic Plan**: ~$13/month
- **S1 Standard Plan**: ~$70/month (with auto-scaling)
- **PostgreSQL**: Depends on tier (check Azure pricing)

## Support

For detailed instructions, see [AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md)
