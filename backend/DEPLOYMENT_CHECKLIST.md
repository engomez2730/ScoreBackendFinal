# Azure Deployment Checklist

## ✅ Pre-Deployment Checklist

- [x] PostgreSQL database configured and accessible
- [x] Database "Score" created with schema
- [x] Test data available (admin user, teams, players)
- [x] Package.json configured with proper scripts
- [x] Node version specified (18+)
- [x] Port configuration using process.env.PORT
- [x] CORS configured
- [x] Web.config created for Azure IIS
- [x] .gitignore created
- [x] Deployment documentation created

## 📋 Deployment Steps

### 1. Create Azure Resources
```bash
az login
az group create --name basketball-rg --location eastus
az appservice plan create --name basketball-plan --resource-group basketball-rg --sku B1 --is-linux
az webapp create --resource-group basketball-rg --plan basketball-plan --name basketball-stats-api --runtime "NODE:18-lts"
```

### 2. Configure Environment Variables
```bash
az webapp config appsettings set --resource-group basketball-rg --name basketball-stats-api --settings \
  DATABASE_URL="postgresql://postgres:Elsa273014!@postgres273014.postgres.database.azure.com:5432/Score?connect_timeout=10&sslmode=prefer" \
  JWT_SECRET="your-production-secret-key-here" \
  NODE_ENV="production"
```

### 3. Enable WebSockets
```bash
az webapp config set --resource-group basketball-rg --name basketball-stats-api --web-sockets-enabled true
```

### 4. Set Startup Command
```bash
az webapp config set --resource-group basketball-rg --name basketball-stats-api --startup-file "node src/index.js"
```

### 5. Deploy Application
Choose one method:

**Method A: ZIP Deploy (Recommended)**
```bash
cd backend
npm install
npx prisma generate
zip -r ../deploy.zip . -x "node_modules/*" -x ".git/*"
cd ..
az webapp deployment source config-zip --resource-group basketball-rg --name basketball-stats-api --src deploy.zip
```

**Method B: Git Deploy**
```bash
cd backend
git init
az webapp deployment source config-local-git --name basketball-stats-api --resource-group basketball-rg
git add .
git commit -m "Initial deployment"
# Get the git URL from previous command output
git remote add azure <git-url>
git push azure main:master
```

**Method C: VS Code Extension**
- Install Azure App Service extension
- Right-click backend folder
- Deploy to Web App

### 6. Verify Deployment
```bash
# Check logs
az webapp log tail --resource-group basketball-rg --name basketball-stats-api

# Test endpoints
curl https://basketball-stats-api.azurewebsites.net/api
curl https://basketball-stats-api.azurewebsites.net/api/teams
```

## 🔧 Post-Deployment Configuration

### Configure Azure PostgreSQL Firewall
1. Go to Azure Portal > PostgreSQL server
2. Connection Security
3. Add rule: "Allow Azure Services" - ON
4. Add your IP if needed for direct access

### Optional: Custom Domain
```bash
# Add custom domain
az webapp config hostname add --webapp-name basketball-stats-api --resource-group basketball-rg --hostname yourdomain.com

# Enable HTTPS
az webapp update --resource-group basketball-rg --name basketball-stats-api --https-only true
```

### Optional: Enable Application Insights
```bash
az monitor app-insights component create --app basketball-stats-insights --location eastus --resource-group basketball-rg
az webapp config appsettings set --resource-group basketball-rg --name basketball-stats-api --settings APPINSIGHTS_INSTRUMENTATIONKEY=<key>
```

## 🧪 Testing

After deployment, test these endpoints:

1. **Health Check**
   ```
   GET https://basketball-stats-api.azurewebsites.net/api
   Expected: "Basketball Stats API running"
   ```

2. **Get Teams**
   ```
   GET https://basketball-stats-api.azurewebsites.net/api/teams
   Expected: JSON array with Lakers and Warriors
   ```

3. **Login**
   ```
   POST https://basketball-stats-api.azurewebsites.net/api/auth/login
   Body: {
     "email": "admin@basketball.com",
     "password": "admin123"
   }
   Expected: JWT token
   ```

4. **WebSocket Connection**
   - Connect to: `wss://basketball-stats-api.azurewebsites.net`
   - Should establish connection successfully

## 🐛 Troubleshooting

### Issue: Application doesn't start
```bash
# Check logs
az webapp log tail --resource-group basketball-rg --name basketball-stats-api

# Verify startup command
az webapp config show --resource-group basketball-rg --name basketball-stats-api --query linuxFxVersion
```

### Issue: Database connection fails
- Verify DATABASE_URL in app settings
- Check Azure PostgreSQL firewall rules
- Ensure "Allow Azure Services" is enabled

### Issue: WebSocket not working
```bash
# Verify WebSocket is enabled
az webapp config show --resource-group basketball-rg --name basketball-stats-api --query webSocketsEnabled
```

### Issue: CORS errors
- Update CORS origin in src/index.js if needed
- Redeploy application

## 📊 Monitoring

### View Logs in Real-Time
```bash
az webapp log tail --resource-group basketball-rg --name basketball-stats-api
```

### View Metrics
```bash
az monitor metrics list --resource basketball-stats-api --resource-group basketball-rg --resource-type "Microsoft.Web/sites" --metric "CpuTime"
```

### Download Logs
```bash
az webapp log download --resource-group basketball-rg --name basketball-stats-api --log-file logs.zip
```

## 💰 Cost Management

### Current Configuration
- **App Service Plan B1**: ~$13/month
- **PostgreSQL**: Depends on tier
- **Bandwidth**: First 5GB free, then ~$0.087/GB

### Cost Optimization Tips
1. Use B1 tier for development/testing
2. Upgrade to S1+ for production with auto-scaling
3. Set up auto-shutdown for non-production environments
4. Monitor usage with Azure Cost Management

## 🔐 Security Checklist

- [ ] Change JWT_SECRET to secure random string
- [ ] Update CORS to specific origins in production
- [ ] Enable HTTPS only
- [ ] Configure Azure PostgreSQL firewall rules
- [ ] Enable Application Insights for monitoring
- [ ] Set up alerts for errors and performance
- [ ] Review and limit IP access if needed
- [ ] Enable managed identity for database access (optional)

## 📝 Notes

- Application URL: `https://basketball-stats-api.azurewebsites.net`
- Default port: 8080 (configured by Azure)
- WebSockets: Required for real-time features
- Database: Azure PostgreSQL "Score" database
- Runtime: Node.js 18 LTS

## 📚 Additional Resources

- [Azure App Service Documentation](https://docs.microsoft.com/azure/app-service/)
- [Azure PostgreSQL Documentation](https://docs.microsoft.com/azure/postgresql/)
- [Socket.IO on Azure](https://socket.io/docs/v4/azure/)
- See [AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md) for detailed guide
- See [DEPLOY.md](./DEPLOY.md) for quick start guide
