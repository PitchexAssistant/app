# 🎨 Figma Integration Instructions

## Quick Start (3 Steps)

### 1️⃣ Get Figma Token
Go to: https://www.figma.com/settings
- Click "Generate new token"
- Copy the token (starts with `figd_`)

### 2️⃣ Add Token to .env
```bash
# Open .env and add:
FIGMA_ACCESS_TOKEN=figd_your_token_here
```

### 3️⃣ Run Integration
```bash
cd figma-integration
./integrate.sh
```

That's it! ✨

---

## What This Does

✅ Extracts ALL pages from your Figma design
✅ Generates React + TypeScript components
✅ Creates Tailwind CSS styling
✅ Exports design tokens (colors, fonts, spacing)
✅ Copies components to frontend (optional)

---

## Your Figma File

**URL:** https://www.figma.com/design/SOkku0aLhqTWwlZ6Vz6U4r/pitchex-ui-dev

**File Key:** SOkku0aLhqTWwlZ6Vz6U4r (already configured)

---

## Output Location

After running, find components in:
```
figma-integration/output/components/
```

Copy to frontend:
```
frontend/components/figma-generated/
```

---

## Detailed Guide

See: `figma-integration/SETUP-GUIDE.md` for complete documentation

---

## Using with Copilot

After generating components, ask Copilot:

```
"I have extracted Figma components. Help me integrate 
the Button component into the pitch practice page with 
emotion detection features."
```

Copilot will understand your design system and help adapt components!

---

## Re-running After Design Updates

Whenever your designer updates Figma:

```bash
cd figma-integration
./integrate.sh
```

Components will be regenerated with latest designs! 🔄
