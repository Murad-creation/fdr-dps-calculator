# Pubali Bank Deposit Calculator (DPS · FDR · TBSD)

Mobile-first calculator (English / বাংলা) styled after the Pubali Bank mobile app. Plain ES modules, no build step.
The same `www/` folder runs in a browser and is packaged as an Android APK with Capacitor.

> **Estimates only.** Results depend on the rates and rules in Settings. Interest rates shipped in `www/js/config.js`
> are **placeholders (8%)**, not Pubali Bank's published rates. Set the current bank rates before customer use.

## Run

```bash
npm test                 # 42 engine unit tests (node:test, no dependencies)
npm run serve            # http://localhost:8080   (or: python3 -m http.server --directory www)
```

## Build the APK (GitHub Actions)

1. Push this folder to a GitHub repository (branch `main`).
2. The workflow `.github/workflows/android.yml` runs the tests, generates the Android project with Capacitor,
   runs `./gradlew assembleDebug` and uploads **app-debug.apk** as a build artifact
   (Actions tab → latest run → Artifacts). Trigger manually with *Run workflow* if needed.
3. Download the APK, allow "install unknown apps" on the phone, install.

Local build (needs JDK 17 + Android SDK): `npm install && npx cap add android && npm run apk`
→ `android/app/build/outputs/apk/debug/app-debug.apk`. A debug APK is for testing; a Play Store release needs a signed release build.

Known WebView limits: *Print / Save PDF* and *Download CSV* use the browser print/download APIs and may not work inside the
Android WebView; add Capacitor `Share` + `Filesystem` plugins if you need them in the APK.

## Updating the phone app (why an install may still show the old version)

* The app shows its version in **Settings → About this app** and at the bottom of **Home**
  (`Version 1.2.0 · Build <run number>-<commit> · date`). `Build dev` means a local run; an APK from GitHub shows e.g. `Build 14-a1b2c3d`.
  Compare the build number with the run number on the GitHub *Actions* tab to know exactly which run you installed.
* Earlier APKs were signed with a different random debug key on every GitHub run, so Android refused to install a new APK over the old one
  and the old app kept running. The workflow now uses the fixed key in `ci/debug.keystore` and raises `versionCode` each run.
  **Uninstall the old app once**, then install the new APK; every later APK installs over it and keeps your settings.
* `ci/debug.keystore` is a throw-away *debug* key (password `android`) and is safe to keep in a public repo. It is not a release key.

## Architecture

```
www/js/engine/   pure calculation engine (no DOM): money, dates, tax, excise, dps, fdr, tbsd, shared, index
www/js/version.js app version / build id (build id stamped by CI)
www/js/config.js default settings (rates, tax, excise slabs, methods, rounding, limits); stored in localStorage
www/js/products.js UI definition per product (fields, defaults, tables)
www/js/app.js, i18n.js, format.js  views, router, EN/BN strings, Bangladeshi number formatting
tests/engine.test.js
```
Add a product: write `calcXxx(input, cfg)` returning `{errors, summary, ...}`, `registerProduct('xxx', fn)` in `engine/index.js`, add an entry in `products.js`.

All money is **integer paisa**; products use BigInt `mulDiv` with the configured rounding (half-up / floor / ceil / banker's, to paisa or taka) — no floating point in financial math.

## Formulas

Common: `Gross = principal + gross interest`, `Take-home = Gross − Source Tax − Excise − Other charges`.
Source tax = interest × 10% (return submitted) or 15% (not submitted), editable. Tax is never applied to principal.

**DPS** – installment paid at the start of each monthly period (opening date = first installment).
Period interest = (capitalised balance + installment) × rate/12. Interest is accrued monthly and capitalised every *k* months
(setting: 1 monthly, 3 quarterly, 6, 12, or 0 = simple); leftover is capitalised at maturity. Tax is deducted once at maturity on total interest.
Optional installment day: first period is pro-rated (days ÷ days in a standard month). Day count can be switched to actual days / 365-366.
Hand check (12 × 1,000 @12%): simple = 780.00 interest; quarterly = 801.90; monthly ≈ 12,809.33 maturity (closed form 1000·((1.01¹²−1)/0.01)·1.01).

**FDR** – the 1 / 3 / 6 / 12-month choice only selects the interest rate (and the renewal period). **Total tenure is a separate input**
(years + extra months), so a 1-year FDR with 5 years total runs 5 terms and renews automatically; there is no separate auto-renewal switch.
Total tenure must be a whole multiple of the term. Term interest = P × rate × months/12 (simple), or compounded every *f* months inside the term (compound).
When there is more than one term you choose the renewal method, with an optional renewal rate:
*principal only* (net interest paid out each term) · *principal + gross interest* (tax accrued and deducted at final maturity) ·
*principal + net interest* (tax deducted every term).

**TBSD (Target Based Small Deposit)** – interest is credited **every month** in both modes and **compounds**: each month
gross interest = balance × rate/12, source tax is deducted from it, and the net interest is added to the balance.
*Monthly mode*: a deposit at the start of each month. *One-time mode*: a single deposit. Minimum tenure 6 months (editable), no maximum:
pick a preset or type any number of years manually (fractions allowed, 2.5 years = 30 months). Final payable = closing balance − excise.
Settings can switch TBSD to *payout* mode (net interest paid out monthly, no compounding), where take-home = principal − excise + interest already paid.

**Excise duty** – one duty per calendar year touched by the account, from the **highest** balance in that year (slabs editable).
Slab upper bounds are inclusive (৳3,00,000 → 0; ৳3,00,001 → 150 …). The maturity day is attributed to the previous day, so an account
maturing on 1 Jan is not charged for the new year. Balance basis is configurable: principal, or principal + accrued interest (default).

## Assumptions to confirm with Pubali Bank (not invented — all configurable)

1. **Actual interest rates** per product/tenure (placeholders only).
2. **DPS interest convention** (monthly vs quarterly capitalisation, installment timing, treatment of late installments / penalties).
3. **TBSD**: eligible tenures, whether monthly-deposit mode accrues on deposit date or month-end, whether net or gross interest compounds (net assumed), and how excise is recovered (assumed deducted from the maturity payout).
4. **Excise duty**: balance definition (principal vs incl. interest), when charged (year-end vs closure), pro-rating for partial years (none assumed), and treatment for monthly-interest products.
5. **Tax timing**: DPS at maturity and FDR per term are assumed; confirm for renewals with deferred interest.
6. **Other charges** (e.g. early encashment, lien, VAT) default to 0 and are a flat per-product amount in Settings.
7. Deposit min/max limits are only technical guard rails (৳1 – ৳1,000 crore).
