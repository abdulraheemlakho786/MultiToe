# 🚀 Vercel Deployment Guide

## Quick Setup (5 Minutes)

### Step 1: Prepare Your Repository
```bash
# If you don't have a GitHub repo, create one:
# 1. Go to GitHub.com
# 2. Click "New Repository"
# 3. Name it "pixel-tic-tac-toe"
# 4. Upload these files to your repo
```

### Step 2: Deploy to Vercel

#### Option A: Vercel Dashboard (Recommended)
1. **Go to [vercel.com](https://vercel.com)**
2. **Click "New Project"**
3. **Import from GitHub**:
   - Click "Import Git Repository"
   - Find your "pixel-tic-tac-toe" repo
   - Click "Import"
4. **Configure Project**:
   - Project Name: `pixel-tic-tac-toe`
   - Framework Preset: `Vite` (or leave as "Other")
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (or leave empty)
   - Output Directory: `./` (default)
5. **Click "Deploy"**
6. **Wait 2-3 minutes** for deployment to complete
7. **Get your live URL**: `https://pixel-tic-tac-toe.vercel.app`

#### Option B: Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
vercel --prod

# Follow the prompts:
# ? Set up and deploy "~/pixel-tic-tac-toe"? [Y/n] y
# ? Which scope do you want to deploy to? (choose your account)
# ? Link to existing project? [y/N] n
# ? What's your project's name? pixel-tic-tac-toe
# ? In which directory is your code located? ./
```

### Step 3: Test Your Deployment
1. **Open your Vercel URL**
2. **Test Local Mode**: Play a quick local game
3. **Test Online Mode**: 
   - Click "ONLINE MULTIPLAYER"
   - Set a player name
   - Try "QUICK MATCH"
   - Open in another browser/tab to test real multiplayer

## ⚙️ Advanced Configuration

### Custom Domain (Optional)
```bash
# In Vercel Dashboard:
# 1. Go to Project Settings
# 2. Click "Domains"
# 3. Add your custom domain
# 4. Configure DNS with your domain provider
```

### Environment Variables (Optional)
```bash
# In Vercel Dashboard:
# 1. Go to Project Settings
# 2. Click "Environment Variables"
# 3. Add any custom variables if needed
```

### Build Optimization
The included `vercel.json` is pre-configured for optimal performance:
- Serverless functions for WebSocket support
- Static file caching
- Compression enabled

## 🔧 Troubleshooting

### Build Fails
```bash
# Check package.json exists and has correct structure
# Ensure all file paths are correct
# Check for syntax errors in JavaScript
```

### WebSocket Connection Issues
```bash
# Verify api/game-server.js exists
# Check vercel.json configuration
# Ensure port 3000 is not used by other services
```

### Game Not Loading
```bash
# Check browser console for errors
# Verify index.html loads without 404s
# Ensure script.js and styles.css are accessible
```

## 📊 Monitoring

### Vercel Analytics
- **Real-time metrics**: Visit counts, performance
- **Error tracking**: Console errors and failures
- **Usage stats**: Bandwidth and function invocations

### Application Logs
```bash
# View function logs in Vercel Dashboard:
# 1. Go to Functions tab
# 2. Click on specific function
# 3. View real-time logs
```

## 🔄 Updates and Maintenance

### Deploy Updates
```bash
# After making changes:
git add .
git commit -m "Update game features"
git push origin main

# Vercel auto-deploys on push to main branch
```

### Rollback
```bash
# In Vercel Dashboard:
# 1. Go to Deployments tab
# 2. Click on previous deployment
# 3. Click "Promote to Production"
```

## ✅ Success Checklist

- [ ] Repository created on GitHub
- [ ] All files uploaded (index.html, styles.css, script.js, api/, etc.)
- [ ] Vercel project created and deployed
- [ ] Local mode works correctly
- [ ] Online multiplayer connects successfully
- [ ] Real-time sync works between tabs/browsers
- [ ] Mobile responsive design works
- [ ] Game resets correctly after wins/draws

## 🎯 Next Steps

After successful deployment:
1. **Share your game URL** with friends
2. **Test with multiple players** to verify stability
3. **Monitor performance** in Vercel dashboard
4. **Consider custom domain** for professional appearance

---

**Your game should now be live and fully functional! 🎮**