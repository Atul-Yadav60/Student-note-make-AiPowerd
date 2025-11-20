# Gemini API Configuration Guide

## 4-Tier Model Fallback System

This application uses an intelligent **4-tier model fallback system** with **4 API keys** to ensure maximum reliability and uptime.

---

## How It Works

### Model Priority (For Each API Key)

Each API key cycles through 4 models in this order:

1. **`gemini-2.0-flash-exp`** (Primary)

   - Fastest and most efficient
   - Best for quick responses
   - Default for all requests

2. **`gemini-1.5-flash`** (Fallback 1)

   - Reliable fast model
   - Activated when primary hits rate limits
   - Good balance of speed and quality

3. **`gemini-1.5-pro`** (Fallback 2)

   - High quality output
   - Deep reasoning capabilities
   - Used for complex content processing

4. **`gemini-1.0-pro`** (Fallback 3)
   - Final backup model
   - Most stable and available
   - Ensures request completion

---

## Rotation Flow

```
API Key 1:
├── gemini-2.0-flash-exp (try first)
├── gemini-1.5-flash (rate limit → try this)
├── gemini-1.5-pro (still limited → try this)
└── gemini-1.0-pro (last resort)

API Key 2:
├── gemini-2.0-flash-exp (start over with new key)
├── gemini-1.5-flash
├── gemini-1.5-pro
└── gemini-1.0-pro

API Key 3:
├── gemini-2.0-flash-exp
├── gemini-1.5-flash
├── gemini-1.5-pro
└── gemini-1.0-pro

API Key 4:
├── gemini-2.0-flash-exp
├── gemini-1.5-flash
├── gemini-1.5-pro
└── gemini-1.0-pro
```

**Total Combinations:** 4 keys × 4 models = **16 fallback attempts**

---

## Setup Instructions

### 1. Get Your API Keys

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create **4 separate API keys** (or use same key 4 times if needed)
4. Copy each key

### 2. Configure Environment Variables

1. Copy `.env.example` to `.env`:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Open `.env` and add your API keys:

   ```env
   VITE_GEMINI_API_KEY_1=AIzaSy...your_first_key
   VITE_GEMINI_API_KEY_2=AIzaSy...your_second_key
   VITE_GEMINI_API_KEY_3=AIzaSy...your_third_key
   VITE_GEMINI_API_KEY_4=AIzaSy...your_fourth_key
   ```

3. Save the file and restart the dev server

---

## Error Handling

### Automatic Fallbacks

The system automatically handles:

- **429 (Rate Limit Exceeded)** → Switches to next model immediately
- **403 (Quota Exceeded)** → Tries next model/key combination
- **404 (Model Not Found)** → Uses fallback model
- **400 (Invalid Request)** → Retries with alternative model

### Manual Retry

If all 16 combinations fail, the user will see an error message prompting them to:

- Wait a few minutes for rate limits to reset
- Try again with the "Retry" button

---

## Best Practices

### For Optimal Performance

1. **Use Different Keys:** If possible, use 4 distinct API keys from different Google accounts
2. **Monitor Console:** Check browser console for which model/key combinations are being used
3. **Stagger Usage:** The system automatically handles this, but avoid making too many simultaneous requests

### Rate Limit Guidelines

**Free Tier Limits (per model per key):**

- `gemini-2.0-flash-exp`: 15 requests/minute
- `gemini-1.5-flash`: 15 requests/minute
- `gemini-1.5-pro`: 2 requests/minute
- `gemini-1.0-pro`: 60 requests/minute

With 4 keys and 4 models, you effectively get:

- **60 requests/min** on fastest models (15 × 4 keys)
- **240 requests/min** on gemini-1.0-pro (60 × 4 keys)

---

## Console Logging

The system logs each attempt in the browser console:

```
Attempt 1/16: Using gemini-2.0-flash-exp with API Key 1
✓ Success with gemini-2.0-flash-exp (Key 1)
```

Or if fallback occurs:

```
Attempt 1/16: Using gemini-2.0-flash-exp with API Key 1
⚠ Rate limit/quota exceeded for gemini-2.0-flash-exp (Key 1). Trying next model...
Attempt 2/16: Using gemini-1.5-flash with API Key 1
✓ Success with gemini-1.5-flash (Key 1)
```

---

## Troubleshooting

### "No Gemini API keys configured"

**Solution:** Make sure your `.env` file exists and contains valid API keys.

### "All 16 API key/model combinations exhausted"

**Solutions:**

1. Wait 1-2 minutes for rate limits to reset
2. Check if your API keys are valid
3. Verify your Google Cloud project has Gemini API enabled
4. Consider upgrading to paid tier for higher limits

### Models not available

Some models may be region-restricted or in preview. The system will automatically skip unavailable models and try the next one.

---

## Advanced Configuration

### Modify Model Priority

To change the model order, edit `src/services/aiService.js`:

```javascript
const MODELS = [
  "gemini-2.0-flash-exp", // Change these
  "gemini-1.5-flash", // to your preferred
  "gemini-1.5-pro", // model priority
  "gemini-1.0-pro", // order
];
```

### Add More API Keys

You can extend beyond 4 keys by:

1. Adding more env variables in `.env`:

   ```env
   VITE_GEMINI_API_KEY_5=...
   VITE_GEMINI_API_KEY_6=...
   ```

2. Updating the `API_KEYS` array in `aiService.js`:
   ```javascript
   const API_KEYS = [
     import.meta.env.VITE_GEMINI_API_KEY_1,
     import.meta.env.VITE_GEMINI_API_KEY_2,
     import.meta.env.VITE_GEMINI_API_KEY_3,
     import.meta.env.VITE_GEMINI_API_KEY_4,
     import.meta.env.VITE_GEMINI_API_KEY_5, // Add more
     import.meta.env.VITE_GEMINI_API_KEY_6,
   ].filter(/* ... */);
   ```

---

## Security Notes

- **Never commit `.env`** to version control
- `.env` is in `.gitignore` by default
- Keep your API keys private
- Regenerate keys if accidentally exposed
- Use environment-specific keys for dev/staging/production

---

## Support

For issues with:

- **API Keys:** [Google AI Studio Support](https://ai.google.dev/support)
- **Rate Limits:** Upgrade your plan or wait for reset
- **This App:** Check browser console for detailed error logs
