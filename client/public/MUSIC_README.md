# 🎵 Background Music Setup

## Adding Your Cosmic Music

To add background music to your website (like Interstellar-style space music):

### Step 1: Get Your Music File

1. **Find or create your music**:
   - Epic space/ambient music (MP3 format recommended)
   - Suggested sources:
     - [Epidemic Sound](https://www.epidemicsound.com) - "Space", "Cinematic Ambient"
     - [Artlist](https://artlist.io) - "Cosmic", "Ethereal", "Space"
     - [AudioJungle](https://audiojungle.net) - Search "interstellar music"
     - Or compose your own!

2. **File requirements**:
   - Format: MP3 (best browser support) or OGG
   - Size: Keep under 10MB for good loading performance
   - Length: 2-5 minutes (will loop seamlessly)
   - Volume: Pre-normalize to -12dB to -18dB (not too loud)

### Step 2: Add Music to Your Project

1. **Place your music file here**:
   ```
   client/public/cosmic-music.mp3
   ```

2. **If using a different filename**, update in `client/src/App.tsx`:
   ```tsx
   <BackgroundMusic audioUrl="/your-filename.mp3" volume={0.3}>
   ```

### Step 3: Adjust Volume (Optional)

In `client/src/App.tsx`, change the volume (0.0 to 1.0):

```tsx
<BackgroundMusic audioUrl="/cosmic-music.mp3" volume={0.3}>
  {/* 0.3 = 30% volume (recommended for background) */}
```

## 🎨 Customization

### Change Button Position

Edit `client/src/components/FloatingMuteButton.tsx`:

```tsx
// Current: bottom-6 right-6
className="fixed bottom-6 left-6 ..."  // Move to bottom-left
className="fixed top-6 right-6 ..."   // Move to top-right
```

### Change Button Style

The mute button uses your theme colors automatically:
- `primary` color when unmuted (playing)
- `muted-foreground` when muted
- Pulsing animation when music is playing

### Disable Music

Comment out in `client/src/App.tsx`:

```tsx
// <BackgroundMusic audioUrl="/cosmic-music.mp3" volume={0.3}>
//   ...
// </BackgroundMusic>
```

## 🎵 Recommended Music Styles

For that Interstellar/cosmic feel:

- **Ambient/Atmospheric**: Long pads, minimal melody
- **Tempo**: 60-90 BPM (slow, contemplative)
- **Instruments**: Synth pads, strings, piano, subtle percussion
- **Mood**: Ethereal, expansive, mysterious, hopeful
- **Keywords**: "Space ambient", "Cosmic", "Celestial", "Interstellar"

## ⚡ Performance Tips

1. **Lazy loading**: Music only loads when page loads
2. **Starts muted**: Browser autoplay policies require this
3. **Preload**: Set to "auto" for instant playback when unmuted
4. **Loop**: Music repeats seamlessly

## 🧪 Testing

1. Open your website
2. Look for floating mute button (bottom-right)
3. Click to unmute and hear music
4. Music should start playing immediately
5. Click again to mute

## 📝 Notes

- Music starts **muted** by default (browser requirement)
- Users must click the mute button to hear sound
- Volume is set to 30% to not overwhelm the experience
- Music plays on all pages site-wide

---

**Need help?** Check `client/src/components/BackgroundMusic.tsx` for audio logic.
