# Post-Deployment Steps

## Clear Browser Cache to See New Video Player

The new Mux Player has been deployed to production, but you may see the old player due to browser caching.

### **Option 1: Hard Refresh (Recommended)**
- **Mac**: Press `Cmd + Shift + R`
- **Windows/Linux**: Press `Ctrl + Shift + R`

This bypasses the browser cache and loads the latest version.

### **Option 2: Clear Cache Manually**
1. Open Browser DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### **Option 3: Incognito/Private Window**
Open the page in an incognito/private window to test without cache.

---

## Verify New Player is Loaded

After clearing cache, you should see the **Mux Video Player** with:
- ✅ Mux branded controls (not native HTML5)
- ✅ Quality selection options
- ✅ Adaptive streaming indicators
- ✅ Modern, consistent UI across all videos

---

## Production URLs

- **Main Site**: https://academion.hu
- **Course Player**: https://www.academion.hu/courses/q9tZIC56NPMcGHTuRYxO/player/X2xb5EQpbiWFfTrNA70R
- **Vercel Dashboard**: https://vercel.com/dmas-projects-358f1142/dma

---

## Latest Deployment

- **Status**: ✅ Ready
- **Deployment ID**: dpl_cqEQEPKbEaFDqaQEoNVp8ZZ1aBwX
- **URL**: https://dma-mqb38bwcc-dmas-projects-358f1142.vercel.app
- **Deployed**: Tue Nov 11 2025 15:07:10 GMT+0100
- **Aliases**:
  - https://academion.hu
  - https://www.academion.hu
  - https://dma-mu.vercel.app

---

## Troubleshooting

If you still see the old player after hard refresh:

1. **Check Browser Console** (F12 → Console tab)
   - Look for any error messages
   - Should see: `🎥 [MuxVideoPlayer] Rendering...` logs

2. **Verify Deployment**
   ```bash
   vercel ls
   ```
   Check that the latest deployment is active.

3. **Check Lesson Data**
   - Open Browser DevTools → Network tab
   - Refresh the page
   - Check the API response for the lesson
   - Verify `muxPlaybackId` or `videoUrl` fields exist

---

## Next Steps (Optional)

### Migrate Existing Videos to Mux

If the lesson doesn't have a `muxPlaybackId`, you can migrate it using the Cloud Function:

```typescript
// From admin panel or browser console
const functions = getFunctions();
const migrate = httpsCallable(functions, 'migrateVideoToMux');

const result = await migrate({
  courseId: 'q9tZIC56NPMcGHTuRYxO',
  lessonId: 'X2xb5EQpbiWFfTrNA70R'
});

console.log(result.data);
```

This will:
1. Upload the video to Mux
2. Update the lesson with `muxAssetId`
3. Set `muxStatus` to 'processing'
4. Add `muxPlaybackId` when ready (usually 1-5 minutes)

---

## Support

If issues persist after cache clear:
- Check Firebase Console for function logs
- Check Vercel deployment logs
- Verify lesson data in Firestore
