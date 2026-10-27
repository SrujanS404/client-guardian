<<<<<<< HEAD
# Legacy Client API Compatibility Guardian

A beginner-friendly MVP that replays saved API requests from older app versions, checks whether the new backend still returns the fields those apps expect, creates a JSON report, and displays the result in a web dashboard. GitHub Actions runs the same check on pushes and pull requests.

> **MVP scope:** This starter includes a working local demo API and rule-based explanations. It does not connect to a hosted AI model, start arbitrary backend applications, or automatically configure repository branch protection. The GitHub workflow fails when compatibility tests fail; configure the check as required in GitHub settings to block merges.

## Requirements
- Node.js 18 or newer (Node.js 20 LTS recommended)
- VS Code
- Git and a GitHub account (only needed for CI)

## 1. Open in VS Code
1. Download and extract the project ZIP.
2. In VS Code, choose **File → Open Folder** and select `client-guardian`.
3. Open **Terminal → New Terminal**.
4. Run:

```bash
npm install
```

## 2. Start the demo backend
In the first terminal:

```bash
npm run start:api
```

You should see `Demo API listening at http://127.0.0.1:4000`.

## 3. Run the Guardian CLI
Open a second terminal in the same folder:

```bash
npm run test:guardian
```

Expected result: **2/2 passed**. The JSON report is written to `reports/latest-report.json`.

You can also run the CLI directly:

```bash
node src/cli.js test
node src/cli.js help
```

## 4. Open the web dashboard
Open a third terminal:

```bash
npm run start:dashboard
```

Then visit **http://localhost:3000** in your browser. Click **Refresh report** after running the CLI to see updated results.

## 5. Demo a breaking backend change
Stop the API terminal with `Ctrl+C`, then restart it with the break switch.

**Windows PowerShell:**

```powershell
$env:BREAK_API="true"; npm run start:api
```

**Windows Command Prompt (cmd):**

```cmd
set BREAK_API=true&& npm run start:api
```

In another terminal, run:

```bash
npm run test:guardian
```

The product responses no longer contain `price`, so the Guardian should fail and return a non-zero exit code. The report and dashboard will explain that the older client expects `body.products[0].price` and `body.products[1].price`. Stop the API and restart normally to return to passing results.

## 6. Add an old API request
Create another `.json` file inside `fixtures/`. Example:

```json
{
  "name": "Legacy app - account details",
  "clientVersion": "1.2",
  "request": {
    "method": "GET",
    "path": "/api/v1/profile"
  },
  "expected": {
    "status": 200,
    "body": {
      "id": 7,
      "name": "Asha",
      "membership": "standard"
    }
  }
}
```

The `expected.body` object is a partial match: specified fields must exist and match; extra fields are allowed. Array checks verify expected items by index and allow additional trailing items.

## 7. Push it to GitHub and enable CI
From the project folder, run:

```bash
git init
git add .
git commit -m "Build Client Guardian MVP"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/client-guardian.git
git push -u origin main
```

First create an empty repository named `client-guardian` on GitHub. Replace `YOUR-USERNAME` with your GitHub username. Do not add a README/license during repository creation if you already have these files locally.

The workflow at `.github/workflows/compatibility.yml` runs on pushes and pull requests. In GitHub, open **Actions** and check the `Legacy Client Compatibility` workflow.

### Make failed checks block merging
1. Open your GitHub repository → **Settings** → **Branches** (or repository rulesets, depending on the UI).
2. Add a branch protection rule / ruleset for `main`.
3. Enable **Require status checks to pass before merging**.
4. Select the compatibility job/check reported by the workflow after its first run.
5. Save the rule.

A failing Guardian run will now make the required check fail and prevent merging under that rule. Repository settings and plan capabilities can affect which protection options are available.

## 8. Deploy the dashboard
For a beginner-friendly public demo, deploy the project as a Node web service on a host that supports Node.js and persistent/redeployable app files. Configure the start command as:

```bash
npm run start:dashboard
```

Set `PORT` only if your host requires it. The dashboard reads `reports/latest-report.json`; for a public deployment, upload or generate a report as part of deployment/CI. A static Vercel deployment alone will not run this Express API endpoint or automatically receive CI reports without extra integration.

## Folder structure

```text
client-guardian/
├── .github/workflows/compatibility.yml  # CI check for pushes and PRs
├── fixtures/                            # Saved old-client requests/expectations
├── public/
│   ├── index.html                       # Dashboard page
│   ├── styles.css                       # Dashboard styling
│   └── app.js                           # Loads report data
├── reports/latest-report.json           # Generated test report
├── src/
│   ├── cli.js                           # Request replay + compatibility checks
│   ├── demo-api.js                      # Sample backend to test against
│   └── dashboard.js                     # Web server + report API
├── guardian.config.json                 # API URL, fixtures and report paths
├── package.json
└── README.md
```

## Important limitations before production
- Only test against a safe test/staging backend, never a production API with real customer data.
- Fixtures can contain request headers or bodies; never commit secrets, access tokens, or personal data.
- This demo checks HTTP status and expected response fields. A production-grade tool should also support authentication via CI secrets, OpenAPI schema diffs, request recording, redaction, retry policies, test isolation, and stronger array/schema validation.
- Explanations are rule-based and labelled AI-style for the demo; no external AI API is called.
=======
# client-guardian
>>>>>>> 29b3ef941d840ecbfbe62bf23ed993919d576aa6
