# LocaFun Design System
## 1. Product
LocaFun is an entertainment discovery and booking platform.
Users can discover, compare and book places and activities:
bowling, swimming pools, football fields, PlayStation/PC clubs,
restaurants, shopping malls, tennis courts, karaoke, billiards,
cinemas and other entertainment venues.
The product should feel:
- energetic
- modern
- social
- trustworthy
- premium but accessible
- easy to use
- visually rich
LocaFun is not a generic marketplace.
It is an entertainment discovery experience.
---
## 2. Design Direction
Use Airbnb-level simplicity and usability,
but create a distinct LocaFun visual identity.
The interface should combine:
- large photography
- strong typography
- clean cards
- rounded UI
- expressive category icons
- bright accent color
- subtle depth
- generous whitespace
Avoid:
- excessive gradients
- glassmorphism
- overly futuristic UI
- excessive shadows
- complicated dashboards
- dense enterprise-style layouts
- copying Airbnb's exact visual language
---
## 3. Brand Personality
Keywords:
ENERGETIC
DISCOVERABLE
SOCIAL
TRUSTWORTHY
PLAYFUL
PREMIUM
LOCAL
The interface should communicate:
"Find something fun to do right now."
---
4. Color System
LocaFun uses a light, premium visual system built around a soft pink brand color, neutral surfaces, dark typography, and high-quality photography.
Brand Colors
Primary brand: #FFA8C5
Primary hover: #FF8FB5
Primary pressed / dark: #E8759C
Primary soft background: #FFF7F9
The primary brand color #FFA8C5 is the main LocaFun identity color.
Use it for:


primary buttons

active states

selected filters

selected categories

links where appropriate

important highlights

booking CTAs

favorite / save states when appropriate

subtle decorative accents
Do not use the brand color as the dominant background of entire pages.
Neutral Colors
Page background: #FFFFFF
Secondary background: #F7F7F5
Soft pink surface: #FFF7F9
Primary text: #171717
Secondary text: #6B6B6B
Muted text: #9A9A9A
Border: #E8E8E8
Strong border: #D9D9D9
Card background: #FFFFFF
Semantic Colors
Success: #22A06B
Success background: #EAF8F1
Warning: #E9A23B
Warning background: #FFF5E3
Error: #D64545
Error background: #FDECEC
Info: #3B82F6
Info background: #EFF6FF
Color Usage Rules
The visual hierarchy should primarily use:


White

Dark text

Neutral gray

LocaFun pink

Photography
Pink should be an accent, not the entire visual language.
Do not:


make every card pink

use pink backgrounds for large sections by default

use pink gradients everywhere

use multiple unrelated pink shades

introduce new brand colors without explicit design-system changes

use saturated neon colors

use excessive colored borders
Most cards should remain white with neutral borders and photography.
Primary Button
Background: #FFA8C5
Text: #171717
Hover: #FF8FB5
Pressed: #E8759C
The primary button must maintain strong visual contrast while preserving the soft LocaFun aesthetic.
Do not use white text on #FFA8C5.
Selected / Active States
Selected controls should use:
Background: #FFF7F9
Border: #FFA8C5
Text / icon: #E8759C
For stronger active states, use: #FFA8C5
Dark Brand Anchor
#171717 is the primary dark anchor of the LocaFun visual system.
Use it for:


headings

important text

navigation

dark buttons when appropriate

high-contrast UI elements

icons
The combination of #171717 + #FFA8C5 should create the main LocaFun visual signature.
Stitch Consistency Rule
These colors are the canonical LocaFun color tokens.
All future LocaFun screens must use this color system.
Do not invent additional brand colors or significantly different shades unless explicitly requested.
The overall visual balance should remain:
White / Neutral surfaces → Dark typography → Pink accents → Photography.
---
## 5. Typography
Use a modern sans-serif typeface.
Recommended:
Inter / Manrope / similar modern grotesk.
Desktop:
H1: 48–56px / 1.05
H2: 32–40px / 1.15
H3: 24–28px / 1.2
Body: 16px / 1.5
Small: 14px / 1.4
Mobile:
H1: 32–36px
H2: 24–28px
H3: 20–22px
Body: 15–16px
Small: 13–14px
Use font-weight 400–800.
---
## 6. Layout
Desktop max-width:
1280–1440px
Main content horizontal padding:
24–40px
Large sections:
64–96px vertical spacing
Mobile:
16–20px horizontal padding
Mobile sections:
32–48px vertical spacing
Use a consistent 4px / 8px spacing system.
---
## 7. Border Radius
Small controls:
10–12px
Cards:
16–20px
Large cards / hero:
24px
Buttons:
12–14px
Search container:
16px / pill where appropriate
Avoid excessive pill-shaped UI.
---
## 8. Shadows
Use subtle shadows only where elevation is necessary.
Cards should primarily use:
- white background
- border
- subtle shadow on hover
Avoid heavy drop shadows.
---
## 9. Buttons
Primary:
filled brand color
Secondary:
white / neutral with border
Ghost:
transparent
Destructive:
red
Button height:
44–52px desktop
Mobile:
48–52px
Primary CTA should always be visually dominant.
---
## 10. Cards
Offer cards are one of the most important components.
Structure:
[large image]
category / badge
Offer title
short location
rating
price
availability / CTA
Example:
┌─────────────────────┐
│                     │
│       PHOTO         │
│                     │
├─────────────────────┤
│ Bowling             │
│ Mega Bowling        │
│ 📍 Tashkent          │
│ ★ 4.8               │
│ from 80 000 сум     │
└─────────────────────┘
Image ratio:
4:3 or 3:2
Use high-quality photography.
---
## 11. Category Cards
Categories should be visually recognizable.
Examples:
Bowling
Pool
Football
Tennis
Gaming
Restaurants
Karaoke
Billiards
Cinema
Shopping
Use simple custom icons or high-quality line icons.
Category cards may use:
- icon
- category name
- optional image
---
## 12. Search
The main search experience is the core of LocaFun.
Desktop:
[ City ] [ Category ] [ Date & time ] [ Search ]
Mobile:
Search should become a large stacked interaction:
Where?
What?
When?
Use one prominent search CTA.
---
## 13. Home Page
Hero:
"Чем займёмся сегодня?"
Supporting text:
"Найдите места для отдыха, спорта и развлечений рядом с вами."
Search module:
City
Category
Date / time
Then:
Popular categories
Popular near you
Recommended
Trending
Collections
---
## 14. Offer Page
Main sections:
Photo gallery
Title
Category
Rating
Location
Description
Amenities / features
Opening hours
Rules
Availability
Seller card
Reviews
Map
Booking CTA
Desktop:
sticky booking panel on the right.
Mobile:
sticky bottom booking CTA.
---
## 15. Seller Badge
Every offer should clearly show who provides the service.
Example:
✓ Verified provider
Provider name
Rating
Number of offers
Response time
Button:
"View provider"
---
## 16. Booking Flow
Booking should be a simple step-by-step flow.
Step 1:
Date
Step 2:
Time
Step 3:
Guests / duration
Step 4:
Contact information
Step 5:
Confirmation
Show progress indicator.
Keep the user focused on one decision at a time.
---
## 17. Chat
Chat is connected to a specific offer.
Header:
Provider
Offer name
Online status
Messages
Quick actions:
"Is this time available?"
"How much does it cost?"
"Can I change the booking?"
Input:
[ Message... ] [ Send ]
Keep the interface similar to familiar messaging apps.
---
## 18. Authentication
Support:
Login
Registration
Phone number
OTP
Optional social login
Keep authentication minimal.
Do not create a complex multi-page registration flow.
---
## 19. Catalog
Catalog page should support discovery.
Top:
Search
Categories
Filters
Sort
Then:
Curated collections
Popular
Near you
Recommended
Use a dense but breathable card grid.
---
## 20. Seller Profile
Seller header:
Avatar / logo
Provider name
Verified badge
Rating
Description
Location
Response rate
Then:
Offers
Reviews
About
Contact
---
## 21. User Account
Sections:
My bookings
Favorites
Messages
Reviews
Profile
Settings
Support
Booking cards should show:
image
offer name
date
time
status
price
CTA
---
## 22. Navigation
Desktop:
Logo
Explore
Categories
Search
Favorites
Messages
Bookings
Profile
Mobile:
Bottom navigation:
Home
Explore
Bookings
Messages
Profile
Keep navigation persistent.
---
## 23. Responsive Design
Every screen must be designed for:
Desktop:
1440px
Tablet:
768–1024px
Mobile:
390px
Desktop layouts should not simply shrink.
Mobile should be intentionally redesigned.
Important mobile principles:
- sticky bottom CTA
- bottom navigation
- full-width cards
- horizontal category scrolling
- stacked booking steps
- simplified filters
- large touch targets
---
## 24. Interaction
Hover:
subtle elevation / border / image scale
Pressed:
small scale reduction
Loading:
skeleton states
Empty:
friendly illustrations and clear CTA
Error:
human-readable explanation
Success:
clear confirmation state
Animations should be subtle and fast.
---
## 25. Accessibility
Minimum touch target:
44px
Maintain strong text contrast.
Do not rely on color alone.
All icons should have accessible labels.
---
## 26. Image Direction
Photography is a major part of LocaFun.
Use:
- real places
- people having fun
- active scenes
- bright natural lighting
- authentic local environments
Avoid generic corporate stock photography.
Images should immediately communicate the activity.
---
## 27. Design Principle
The user should be able to answer three questions immediately:
1. What can I do?
2. Where can I do it?
3. Can I book it now?
Every major screen should move the user toward discovery or booking.