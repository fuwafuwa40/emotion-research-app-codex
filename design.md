# EmotionLab - Mobile App Interface Design

## Screen List

| Screen | Path | Description |
|--------|------|-------------|
| Sessions (Home) | /(tabs)/index | Session list, dummy data generation, clear all |
| Record | /(tabs)/record | 3-step input (speech, self-report, biometrics) |
| Analysis | /(tabs)/analysis | Stats summary, time series, correlation analysis |
| Session Detail | /session-detail | Individual session full data display |

## Color Palette

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| primary | #2563EB | #3B82F6 | Accent, buttons |
| background | #F8FAFC | #0F172A | Screen background |
| surface | #FFFFFF | #1E293B | Card background |
| foreground | #0F172A | #F1F5F9 | Text |
| success | #16A34A | #4ADE80 | Positive |
| warning | #D97706 | #FBBF24 | Neutral |
| error | #DC2626 | #F87171 | Negative |

## Key User Flows

### Data Recording Flow
1. Tap Record tab
2. Step 1: Enter speech text -> Next
3. Step 2: Select Valence (1-9) and Arousal (1-9) -> Next
4. Step 3: Enter heart rate and skin conductance (dummy generation available) -> Save
5. Auto-navigate to Sessions tab

### Analysis Flow
1. Generate data with +20 Dummy on Sessions tab
2. Check stats summary, time series, correlations on Analysis tab
3. Tap session card for detail view

## Layout Policy
- Mobile portrait (9:16) orientation
- iOS HIG-compliant card, list, button design
- ScreenContainer + SafeArea for full screen support
