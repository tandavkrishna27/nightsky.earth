# Homepage hero and MCP address design

The homepage should lead with “Know when, where, and how to look up.” Its supporting text should explain that NightSky works in an AI assistant and helps with sky timing, possible observing places, and practical preparation. The welcome screen and footer retain “Where Earth meets the stars.”

A compact card beneath the homepage action and assistant names shows the public MCP connection address with a copy button and a link to the Get Started instructions. A larger instance appears directly after the Get Started introduction, before the assistant choices. Both use the existing public endpoint constant so the address cannot drift between pages. The existing manual setup guide remains available.

The card must match the site’s dark and gold visual language, allow selecting the address if clipboard access fails, announce copy success or failure, and remain usable on narrow screens. Copy success briefly brightens its gold border and twinkles five small stars around its perimeter, while a temporary checkmark appears inside the fixed-size button. Nothing shifts or covers the address; reduced-motion users see the brighter border and checkmark without animation. Clipboard failure shows Retry in the same button. ChatGPT and Claude show directory review pending, while Gemini and Grok show listing coming soon with their manual setup links still available. This is a local website change for the owner to review before any publication.

## Approaches

1. **Shared address card in both locations (chosen):** immediate copy action on either page, one component and one URL source. Costs some hero space.
2. **Get Started only:** less hero content, but hides manual connection from visitors who arrive at the homepage.
3. **Hero only:** quick access, but leaves the detailed setup page without the prominent address.
