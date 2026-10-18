# Website performance and quality improvement plan

## Goal

Improve the production website's mobile loading experience using the confirmed PageSpeed findings, preserve the NightSky visual experience, correct the Sky Events calendar contrast finding, and deploy the verified result. The NightSky plugin and MCP implementation are outside scope and must remain untouched.

## Baseline evidence

PageSpeed Insights on the production site reported mobile scores of Home 78, Get Started 70, Resources 83, and Sky Events 67; a fresh Sky Events run on 18 October 2026 reported 68 mobile, FCP 3.2s, LCP 5.8s, TBT 150ms, CLS 0.002, 6,408 KiB transferred, 305 KiB image savings, and 1,530ms render-blocking savings. Desktop Home scored 97. The reports had no CrUX field data, so these are lab measurements. Main confirmed issues are a 5.5 MiB music file fetched before opt-in, a 4.0 MiB splash video, a 20.4 MiB homepage hero video requested before entry, Google Fonts render blocking/font-induced layout shift, and a calendar contrast failure for outside-month dates. A previous Sky Events run reported 33-second LCP, while the fresh run reports 5.8s, so no route-specific LCP fix is assumed; compare the exact URL after deployment.

## Implementation choices

1. Keep the sound experience opt-in. Prevent the browser from fetching the audio file until a visitor starts music, and prove this with browser request assertions.
2. Preserve both existing videos and their visual treatment while transcoding to efficient web-compatible encodings and dimensions. Convert the six large site photography assets and splash poster to WebP, keeping their original dimensions and visual subjects. Keep the posters as fallbacks, preserve reduced-motion and Save-Data behavior, and measure the files before and after. Do not add third-party media services.
3. Remove unnecessary render-blocking font work and prevent font swapping from shifting content. Prefer self-hosted licensed variable font subsets when the repository and source permit; otherwise use a tested local/system fallback treatment. Keep type styling recognizable.
4. Fix the calendar outside-month text to meet WCAG 2.2 AA 4.5:1 contrast without reducing selected/today state clarity; add a browser-level contrast regression check.
5. Re-run the Sky Events audit on the exact canonical calendar URL and inspect its network/element timing before deciding whether any route-specific optimization is warranted.

## Tasks and verification

### Task 1 — Lock down loading behavior

- Add browser tests that assert the MP3 is not requested before an explicit sound action and is requested after that action.
- Reproduce the Sky Events route and record the PageSpeed baseline for the exact canonical URL; run local production checks in mobile and desktop browser viewports.
- Expected: the audio test fails on the current implementation; the live baseline confirms the older 33-second LCP report is not repeatable and documents the current 5.8-second result.

### Task 2 — Reduce media payload

- Transcode the existing splash and homepage videos without changing plugin assets; preserve dimensions appropriate to a full-screen background and retain a poster fallback.
- Convert the six large website photography assets to WebP and update their imports, retaining existing source JPEGs for provenance.
- Set audio preload to none and attach its source only if necessary to guarantee zero pre-consent/pre-action downloads across tested browsers.
- Expected: automated browser checks show no audio request before opt-in, sound still plays after opt-in, video and image assets are materially smaller, and visual review confirms continuity.

### Task 3 — Stabilize fonts and calendar contrast

- Apply the selected font delivery approach and update the website source/privacy inventory if Google-hosted fonts are removed.
- Adjust calendar outside-month contrast and test the rendered foreground/background ratio.
- Expected: no Google Fonts render-blocking request when self-hosted/local fallback is selected; calendar date text reaches at least 4.5:1.

### Task 4 — Verify, review, and prepare deployment

- Run unit tests, type checks, browser tests, release build, and `git diff --check`; inspect the final diff for plugin or MCP paths.
- Run production-like mobile and desktop audits on Home, Get Started, Resources, and canonical Sky Events. Compare performance scores, FCP/LCP/TBT/CLS and transferred bytes to the baseline, and re-test consent-gated analytics.
- Obtain a separate code review if an available review tool permits; otherwise perform a documented self-review.
- Create a website-only pull request, check its CI and Netlify deploy preview, merge after checks pass, then inspect the Netlify production deploy and re-run live smoke/performance checks.
- Expected: deployed production site serves the merged commit, no plugin/MCP files changed, no high-severity test/accessibility issues remain, and the measured mobile experience improves against the baseline. Record remaining lab/field-data limitations honestly.

## Plan self-review

- Scope is limited to issues supported by current measurements; the contradictory Sky Events LCP is explicitly treated as an investigation, not a presumed code defect.
- Media changes preserve the existing creative direction and use local assets, while interaction and accessibility behavior receive regression checks.
- Font hosting/license and privacy disclosures are linked to the chosen technical approach so source records stay accurate.
- Deployment is conditional on successful tests, preview, and CI, but the requested full process includes the final production verification.
- Success is a reproducible reduction in unnecessary initial transfer, stable layout, compliant contrast, and an improved mobile lab result on the same production routes; lab results are not presented as field Core Web Vitals.
