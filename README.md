# CivicWatch

**Public money, made understandable.**

CivicWatch is a public-spending transparency project focused on Tennessee. It helps people explore government expenditure records, compare reported totals, and follow the numbers back to their sources.

The goal is to make public financial information easier to understand—not to accuse a government, department, employee, or vendor of wrongdoing. **Evidence first. Conclusions second.**

## Open CivicWatch

- **[Spending Explorer](https://jdmarlow86.github.io/CivicWatch/)** — search and explore the expenditure records currently available in the app.
- **[County Comparison & Financial Trends](https://jdmarlow86.github.io/CivicWatch/county-comparison.html)** — compare reported county totals and view available year-by-year trends.
- **[Funding Sources](https://jdmarlow86.github.io/CivicWatch/funding.html)** — explore funding information collected from the sources shown on that page.

## What you can do

### Explore spending records
Search and filter the available records to find information by government, fiscal year, category, department, purpose, or amount, where those fields are provided. Open an individual record to see its reported description and other available details.

### Understand categories
Some spending categories use accounting terminology that can be hard to interpret. CivicWatch provides short, plain-language explanations to help readers understand what a category generally covers. These explanations are guides to the category—not proof of the precise goods or services purchased.

### Compare counties and look at trends
The comparison page adds up the matching records in the currently published dataset. You can filter by fiscal year and category, search for a county, export the displayed comparison as a CSV file, and view the available historical totals for a selected county.

These totals represent the records available to CivicWatch under the selected filters. They should not automatically be treated as a complete total of everything a county government spent.

### Check data quality and freshness
The Data Quality & Freshness panel reports checks such as the number of records loaded, governments represented, fiscal-year coverage, and records with missing or invalid fields. CivicWatch does not claim a dataset is complete simply because these checks pass.

## Where the information comes from

CivicWatch uses published government financial information, including Tennessee Comptroller data from the **Transparency and Accountability in Government (TAG)** reporting system. The app's pages link to the official sources used for context and verification.

TAG expenditure records are useful for examining reported public financial information, but they are not necessarily a transaction-by-transaction checkbook or a complete, consolidated view of every fund and activity for every government. Source coverage and the way information is reported can differ.

For important questions, open the linked original source and consult official financial reports or audit reports where appropriate.

## How to read the numbers responsibly

- **A reported amount is not, by itself, evidence of a problem.** CivicWatch presents information so readers can investigate and form evidence-based conclusions.
- **A missing record does not mean zero spending.** It may mean the information is unavailable in the dataset used by the app.
- **County totals may not be directly comparable.** Governments can differ in responsibilities, fund structures, reporting coverage, and how services such as education are accounted for.
- **Year-to-year changes need context.** Changes can reflect reporting coverage, accounting practices, or other factors in addition to changes in spending.
- **Category descriptions are explanatory, not allegations.** They summarize the general meaning of an accounting label and may not explain a specific transaction.
- **Automated quality checks have limits.** They can identify some missing or invalid fields, but they cannot verify every entry or replace an official audit.
- **Dates matter.** The date a source publishes information, the date CivicWatch retrieves it, and the date the website deploys it are different. If a verified retrieval date is not available, CivicWatch should say so rather than guess.

## Project status

CivicWatch is an evolving public-interest project. The data and features shown on the live site depend on the source files currently available and the latest successful deployment. Some records or historical years may be missing, and features may change as source coverage improves.

If a page appears blank or shows an error, check the [GitHub Actions deployment status](https://github.com/jdmarlow86/CivicWatch/actions) and try again after a successful deployment.

## For developers

CivicWatch is built with React and Vite and is published through GitHub Pages. GitHub Actions builds and deploys the site. The expenditure data loader and import scripts support normalizing source data for the app and local analysis.

### Run locally

You will need Node.js and npm installed.

```bash
git clone https://github.com/jdmarlow86/CivicWatch.git
cd CivicWatch
npm install
npm run dev
```

Vite will print a local development address in the terminal. Open that address in your browser.

### Build and check the site

```bash
npm run build
npm run preview
```

The build command checks that the app can be compiled for deployment. The preview command serves the built version locally.

### Data tools

The repository also includes scripts for downloading and processing Tennessee TAG expenditure data and querying a local SQLite database:

```bash
npm run data:download -- 2025
npm run data:import -- "data/raw/E2025 Expenditures.xlsx"
npm run data:db
npm run data:query -- road
npm run data:report
```

The download/import commands depend on the relevant official source being available and on the input file matching the expected format. Check the scripts and current source instructions before running them; do not assume that a local database is the same as the data currently published on the live site.

## Principles

1. **Source-first:** Make it possible to trace figures back to published information.
2. **Plain language:** Explain public financial terminology without changing the meaning of the source.
3. **Transparency about limitations:** State what is known, what is calculated, and what is not established.
4. **No unsupported accusations:** Display evidence and context; let readers investigate.
5. **Improve over time:** Strengthen source coverage, data-quality checks, and explanations as better information becomes available.

---

CivicWatch is an independent transparency project. Refer to the linked official records for authoritative financial reporting.
