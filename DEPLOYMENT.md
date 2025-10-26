# 🚀 Deployment Guide for NightSky.earth

This guide provides detailed instructions for deploying NightSky.earth to Netlify and other platforms.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Netlify Deployment](#netlify-deployment)
3. [Environment Variables](#environment-variables)
4. [Custom Domain Setup](#custom-domain-setup)
5. [Performance Optimization](#performance-optimization)
6. [Troubleshooting](#troubleshooting)
7. [Alternative Platforms](#alternative-platforms)

## Prerequisites

Before deploying, ensure you have:

- ✅ Node.js 20+ installed locally
- ✅ Git repository (GitHub, GitLab, or Bitbucket)
- ✅ Netlify account (free tier works)
- ✅ Successful local build (`npm run build`)
- ✅ All environment variables documented

## 🌐 Netlify Deployment

### Method 1: Git Integration (Recommended)

This method provides automatic deployments on every push.

#### Step 1: Push to Git Repository

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit - Ready for deployment"

# Add remote repository
git remote add origin https://github.com/yourusername/nightsky.earth.git

# Push to GitHub
git push -u origin main
```

#### Step 2: Import to Netlify

1. **Login to Netlify**
   - Go to [app.netlify.com](https://app.netlify.com)
   - Sign in or create an account

2. **Create New Site**
   - Click "Add new site" → "Import an existing project"
   - Choose your Git provider (GitHub/GitLab/Bitbucket)
   - Authorize Netlify to access your repositories

3. **Select Repository**
   - Find and select `nightsky.earth` repository
   - Click on the repository name

4. **Configure Build Settings**
   
   Netlify should auto-detect from `netlify.toml`, but verify:
   
   - **Branch to deploy**: `main` (or your primary branch)
   - **Build command**: `npm run build`
   - **Publish directory**: `dist/public`
   - **Base directory**: (leave empty)

5. **Deploy Site**
   - Click "Deploy site"
   - Wait 2-5 minutes for build to complete
   - Your site is live! 🎉

#### Step 3: Configure Site Settings

1. **Site Name**
   - Go to Site settings → General → Site details
   - Click "Change site name"
   - Choose a unique name (e.g., `nightsky-earth`)
   - Your site will be at `https://nightsky-earth.netlify.app`

2. **Build Settings**
   - Go to Site settings → Build & deploy → Build settings
   - Verify Node version: `20`

3. **Environment Variables** (if needed)
   - Go to Site settings → Environment variables
   - Add any required variables (see below)

### Method 2: Netlify CLI

For developers who prefer command-line deployment.

#### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

#### Step 2: Login

```bash
netlify login
```

This opens a browser window for authentication.

#### Step 3: Initialize Site

```bash
# In your project directory
netlify init
```

Follow the prompts:
- Create & configure a new site
- Choose your team
- Enter site name
- Build command: `npm run build`
- Directory to deploy: `dist/public`

#### Step 4: Deploy

```bash
# Deploy to production
netlify deploy --prod
```

Or deploy to a preview first:

```bash
# Deploy preview
netlify deploy

# If preview looks good, deploy to production
netlify deploy --prod
```

### Method 3: Manual Deploy (Drag & Drop)

For quick testing or one-time deployments.

#### Step 1: Build Locally

```bash
npm run build
```

#### Step 2: Deploy

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag the `dist/public` folder onto the page
3. Your site is live instantly!

**Note**: This method doesn't support automatic deployments.

## 🔐 Environment Variables

### Development vs Production

Create a `.env.production` file for production-specific variables:

```env
# Production Environment Variables
NODE_ENV=production

# Session Secret (required)
SESSION_SECRET=your-secure-random-secret-key

# Optional: Analytics
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
VITE_FACEBOOK_PIXEL_ID=XXXXXXXXXX

# Optional: Third-party integrations
VITE_STRIPE_PUBLIC_KEY=pk_live_xxxxx
```

### Setting Variables in Netlify

1. **Via Dashboard**
   - Site settings → Environment variables
   - Click "Add a variable"
   - Key: `SESSION_SECRET`
   - Value: `your-secret-here`
   - Scope: All scopes
   - Click "Create variable"

2. **Via CLI**
   ```bash
   netlify env:set SESSION_SECRET "your-secret-here"
   ```

3. **Via netlify.toml**
   ```toml
   [build.environment]
     NODE_VERSION = "20"
     # Note: Don't add secrets here!
   ```

### Important Notes

- ⚠️ **Never commit `.env` files** to Git
- ✅ **Use `.env.example`** for documentation
- 🔒 **Rotate secrets regularly**
- 📝 **Document all required variables**

## 🌍 Custom Domain Setup

### Step 1: Add Domain in Netlify

1. Go to Site settings → Domain management
2. Click "Add custom domain"
3. Enter your domain (e.g., `nightsky.earth`)
4. Click "Verify"

### Step 2: Configure DNS

#### Option A: Netlify DNS (Recommended)

1. Add domain to Netlify DNS
2. Update nameservers at your domain registrar:
   ```
   dns1.p08.nsone.net
   dns2.p08.nsone.net
   dns3.p08.nsone.net
   dns4.p08.nsone.net
   ```
3. Wait for DNS propagation (up to 48 hours)

#### Option B: External DNS

Add these DNS records at your domain registrar:

**For apex domain (nightsky.earth):**
```
Type: A
Name: @
Value: 75.2.60.5
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: your-site-name.netlify.app
```

### Step 3: Enable HTTPS

1. Go to Site settings → Domain management → HTTPS
2. Click "Verify DNS configuration"
3. Wait for SSL certificate provisioning (automatic)
4. Enable "Force HTTPS" redirect

### Step 4: Test

```bash
# Check DNS propagation
nslookup nightsky.earth

# Test HTTPS
curl -I https://nightsky.earth
```

## ⚡ Performance Optimization

### Build Optimizations

#### 1. Enable Build Plugins

Create `netlify/plugins/` directory and add:

```bash
# Install Netlify plugins
npm install --save-dev @netlify/plugin-lighthouse
```

Update `netlify.toml`:

```toml
[[plugins]]
  package = "@netlify/plugin-lighthouse"
  
  [plugins.inputs.thresholds]
    performance = 0.9
    accessibility = 0.9
    seo = 0.9
```

#### 2. Image Optimization

Add image optimization plugin:

```toml
[[plugins]]
  package = "@netlify/plugin-image-optimizer"
```

#### 3. Enable Asset Optimization

In Netlify dashboard:
- Site settings → Build & deploy → Post processing
- Enable "Asset optimization"
- Enable "Pretty URLs"

### Runtime Optimizations

The `netlify.toml` already includes:

✅ **Aggressive caching** for static assets (1 year)  
✅ **Security headers** (XSS, clickjacking protection)  
✅ **SPA redirect** for client-side routing  

### Performance Checklist

- [ ] Images optimized (WebP format where possible)
- [ ] Lazy loading implemented
- [ ] Code splitting enabled (Vite default)
- [ ] Asset compression (Netlify automatic)
- [ ] Browser caching configured
- [ ] CDN enabled (Netlify automatic)

## 🔧 Troubleshooting

### Build Failures

#### Error: "Command failed with exit code 1"

**Solution**: Check build logs for specific errors

```bash
# Test build locally first
npm run build

# Check for TypeScript errors
npm run check

# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

#### Error: "Node version mismatch"

**Solution**: Specify Node version in `netlify.toml`

```toml
[build.environment]
  NODE_VERSION = "20"
```

### Deployment Issues

#### Issue: Site shows 404 for routes

**Cause**: Missing SPA redirect rule

**Solution**: Verify `netlify.toml` contains:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Issue: Assets not loading

**Cause**: Incorrect publish directory

**Solution**: 
1. Verify build output: `ls -la dist/public`
2. Check `netlify.toml`: `publish = "dist/public"`

#### Issue: Environment variables not working

**Cause**: Missing `VITE_` prefix for frontend variables

**Solution**: Frontend variables must start with `VITE_`:

```env
VITE_API_URL=https://api.example.com
```

### DNS Issues

#### Domain not resolving

1. **Check DNS propagation**
   ```bash
   dig nightsky.earth
   ```

2. **Verify nameservers**
   ```bash
   nslookup -type=ns nightsky.earth
   ```

3. **Wait for propagation** (up to 48 hours)

#### SSL certificate not provisioning

1. Verify DNS is correctly configured
2. Check domain ownership
3. Try "Renew certificate" in Netlify
4. Contact Netlify support if issue persists

## 🌟 Alternative Platforms

### Vercel

1. **Deploy**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Configure**
   Create `vercel.json`:
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist/public",
     "devCommand": "npm run dev",
     "installCommand": "npm install",
     "framework": "vite",
     "rewrites": [
       { "source": "/(.*)", "destination": "/" }
     ]
   }
   ```

### GitHub Pages

**Note**: GitHub Pages is for static sites only (no backend)

1. **Install gh-pages**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add deploy script** to `package.json`:
   ```json
   "scripts": {
     "deploy": "npm run build && gh-pages -d dist/public"
   }
   ```

3. **Deploy**
   ```bash
   npm run deploy
   ```

### Cloudflare Pages

1. **Connect repository** in Cloudflare Pages dashboard
2. **Configure**:
   - Build command: `npm run build`
   - Build output directory: `dist/public`
   - Root directory: `/`

## 📊 Monitoring & Analytics

### Add Google Analytics

1. **Get GA4 tracking ID** from Google Analytics

2. **Add to environment variables**
   ```env
   VITE_GA_TRACKING_ID=G-XXXXXXXXXX
   ```

3. **Add tracking code** to `client/index.html`

### Netlify Analytics

- Site settings → Analytics
- Enable "Netlify Analytics" ($9/month)
- Get server-side analytics without cookies

### Performance Monitoring

Use Netlify's built-in metrics:
- Deploy frequency
- Build time
- Bandwidth usage
- Traffic patterns

## 🎯 Post-Deployment Checklist

After successful deployment:

- [ ] Site is accessible via HTTPS
- [ ] All routes work correctly (test navigation)
- [ ] Images load properly
- [ ] Forms work (test contact form)
- [ ] Mobile responsive (test on devices)
- [ ] SEO meta tags present (view source)
- [ ] Social sharing works (test Open Graph)
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Analytics tracking (if configured)
- [ ] Performance score >90 (Lighthouse)

## 📞 Support

### Netlify Support

- **Documentation**: [docs.netlify.com](https://docs.netlify.com)
- **Community**: [answers.netlify.com](https://answers.netlify.com)
- **Status**: [netlifystatus.com](https://www.netlifystatus.com)
- **Support**: [support@netlify.com](mailto:support@netlify.com)

### Project Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/nightsky.earth/issues)
- **Email**: hello@nightsky.earth

---

**Last updated**: October 26, 2025  
**Next review**: Check for Netlify updates quarterly
