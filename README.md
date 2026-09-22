# QR Code Studio — GDG on Campus SRM Technical Task

A browser-only QR Code Generator & Designer built with React, Vite, JavaScript, CSS and the `qrcode` library.

## Requirement coverage

- URL and plain text QR generation in real time
- QR types: URL, Plain Text, Email, Phone Number, Wi-Fi
- Type-specific inputs and validation
- QR size, foreground/background, error correction and margin controls
- Immediate preview updates
- Presets with editable settings after selection
- PNG download matching the preview
- SVG download (optional enhancement)
- Copy encoded payload (optional enhancement)
- Gradient modules (optional enhancement)
- Scan-reliability guidance and validation warnings
- Recent QR codes persisted in `localStorage`
- Reuse saved QR codes after refresh
- Responsive desktop/mobile layout
- No backend or database required

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Production build

```bash
npm run build
npm run preview
```

## Vercel / Netlify

This is a Vite SPA with no server-side API. Use the default Vite build command:

- Build command: `npm run build`
- Output directory: `dist`

For Vercel, importing the GitHub repository is sufficient; Vercel detects Vite automatically.
For Netlify, use the same build command and `dist` publish directory.

## Testing checklist

Manually verify before submission:

1. URL QR generates while typing and scans correctly.
2. Plain Text QR generates and scans correctly.
3. Email QR opens an email composer on a supported device.
4. Phone QR opens a dialer on a supported device.
5. Wi-Fi QR contains the correct SSID, password, security type and hidden-network flag.
6. Size, colors, error correction and margin update the preview immediately.
7. Each preset can be selected and then modified.
8. PNG download visually matches the preview and scans correctly.
9. SVG download works.
10. Invalid URL/email/phone/Wi-Fi input shows an error.
11. Recent QR entries can be reused.
12. Refreshing the page keeps recent QR entries.
13. Test at desktop width and mobile width.
14. Test low-contrast/long payload cases and keep QR modules readable.

## Screenshots for submission

The GDG task document asks candidates to add screenshots of the application to the public GitHub repository. Capture your own screenshots after running the app and place them in a `screenshots/` folder. Do not submit generated placeholder screenshots.

Suggested screenshots:
- Desktop URL QR preview
- QR customization panel
- Wi-Fi form
- Recent QR history after refresh
- Mobile responsive view

## Architecture

`src/main.jsx` contains the UI, QR payload formatting, validation, preview generation, download actions and local persistence. `src/styles.css` contains the responsive visual system. The QR library runs entirely in the browser, so the application does not send QR data to a backend.

## Important implementation note

The repository should be treated as a starting implementation. Before submitting, read the code, understand every feature, customize the UI/implementation where appropriate, and test it yourself. The recruitment brief warns that plagiarized code can result in cancellation of candidature.
