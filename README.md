# UK Public Sector Graduate Schemes – Repository

This repository contains the Markdown source, build tooling, and static assets that power [publicsectorgradschemes.co.uk](https://publicsectorgradschemes.co.uk). The published site is generated directly from the Markdown content in this file.

## Development

### Requirements

- Node.js 18+ (the build scripts run as native ES modules).

### Install & build

- `npm install` – install dependencies.
- `npm run build` – regenerate `dist/index.html`, copy static assets, and transpile the client bundle with `esbuild`. The build exits with an error if `esbuild` is missing.

### Tooling

- Optional: `pre-commit install` to enable the configured lint/format hooks, or run them manually with `pre-commit run --all-files`.
- Client-side code is authored in modern JavaScript and must be transpiled; install dependencies so `esbuild` is available before running the build.

### Project structure

- `scripts/build.js` orchestrates the Markdown → HTML build and pulls helpers from `scripts/utils/`.
- `client/search.js` handles client-side filtering and navigation behaviour and is transpiled into `dist/search.js` during the build.
- Role names and aliases live in `config/roles.json`.

## Content structure

- The section between `<!-- site-content:start -->` and `<!-- site-content:end -->` is the only portion that is transformed into the public site.
- Keep scheme entries inside that block so the build process continues to produce the same output.
- Everything outside the markers is ignored by the build step and can be used for documentation, contributor guidance, or project notes.

### Adding a new scheme

- Use a Markdown list item in the format `- [Organisation and scheme name](https://example.org) {Role Type One} {Role Type Two}`.
- Link directly to the official scheme or recruitment page whenever possible
- Role types must appear as `{Role Type}` tags, matching the canonical labels defined in `config/roles.json`. Multiple tags are allowed and should be ordered from most to least relevant.
- If a scheme belongs in a new organisation type section, add a heading (`##`, `###`, etc.) before the list so the generated navigation stays organised.
- Ensure the scheme is inserted in alphabetical order within its section.
- To include an explanatory note, add a blank line followed by an indented paragraph beneath the list item:

  ```markdown
  - [Example Scheme](https://example.org) {Policy}

    Runs annual campaigns focused on environmental policy.
  ```

  That indented paragraph will appear with the same styling as other descriptive text on the page.

### Role types and colours

- Role metadata lives in `config/roles.json`. Each entry key is the role slug (used in the `data-role` attribute) and can include:
  - `label` (required): the human-readable text displayed on tags.
  - `aliases` (optional array): alternative strings that will resolve to the same role when parsing `{Role}` tags in Markdown.
  - `hue` (optional number) or `color` (optional hex): customise the role pill palette.
- `hue` is the hue component of the HSL colour space, expressed in degrees (0–360). The browser code derives saturated, accessible background/border/text colours from that single value—e.g. `0` ≈ red, `120` ≈ green, `240` ≈ blue.
- After updating the config or Markdown, run `npm run build` and check `dist/index.html` to confirm the role pills render as expected.

## Contributing

- Check issues for anything already being worked on, or open one before making large changes.
- Keep Markdown content accessible: prefer descriptive link text and ensure new headings follow a logical hierarchy.
- When updating the list, run `npm run build` and check the generated `dist/index.html` to confirm no unintended regressions.

<!-- site-content:start -->

# All UK public sector graduate schemes

Crowdsourced links to all UK public sector grad schemes and grad jobs - covering the Civil Service, public bodies, local government, healthcare, policing, and more.

Most schemes recruit only at specific times of the year. Many welcome careers changers who graduated some years ago, and some are also open to non-graduates. Many of the included organisations also offer entry-level roles and apprenticeships that can be suitable for graduates.

### Is something wrong or missing?

Please either:

1. [Fill out this one-question form](https://forms.office.com/r/KL0yJtLdgh)
2. Email [feedback@publicsectorgradschemes.co.uk](mailto:feedback@publicsectorgradschemes.co.uk)
3. [Submit a GitHub pull request](https://github.com/chrishylanduk/uk-public-sector-graduate-schemes-list/pulls)

## Civil Service

### Cross-government schemes

- [Civil Service Fast Stream](https://www.faststream.gov.uk) {Generalist & Leadership} {Policy} {Digital, Data & Cyber} {Operational Delivery & Public Services} {Finance, Audit & Commercial} {Economics, Research & Analysis} {HR, Communications & Creative} {Project, Infrastructure & Property Management} {Science, Engineering & Environment} {Legal, Risk & Compliance}

### Analytical professions

- [Government Actuary's Department (GAD) Graduate Analyst and Trainee Actuary programmes](https://www.gov.uk/government/organisations/government-actuarys-department/about/recruitment) {Economics, Research & Analysis}
- [Government Economic Service (GES) Assistant Economist Graduate Scheme](https://www.gov.uk/guidance/assistant-economist-recruitment) {Economics, Research & Analysis}
- [Government Operational Research Service (GORS) - Mainstream Recruitment Level 2](https://www.gov.uk/guidance/government-operational-research-service-mainstream-recruitment) {Economics, Research & Analysis}
- [Government Social Research (GSR) Research Officer Graduate Scheme](https://www.gov.uk/guidance/gsr-social-research-scheme) {Economics, Research & Analysis}
- [Government Statistical Service (GSS) Statistical Officers](https://www.civil-service-careers.gov.uk/professions/government-statistical-service/) {Economics, Research & Analysis}

### Legal & regulatory departments

- [Competition and Markets Authority (CMA) Delivery Graduate Scheme](https://www.civil-service-careers.gov.uk/cma-graduate-scheme/) {Generalist & Leadership} {Regulation & Enforcement} {Legal, Risk & Compliance} {Economics, Research & Analysis}
- [Crown Prosecution Service (CPS), Legal trainee scheme](https://www.cps.gov.uk/careers/legal-trainee) {Legal, Risk & Compliance}
- [Government Legal Profession, Legal trainee scheme](https://www.gov.uk/guidance/government-legal-service-gls-legal-trainee-scheme-how-to-apply) {Legal, Risk & Compliance}
- [HMRC Tax Specialist Programme](https://careers.hmrc.gov.uk/tax-graduates) {Regulation & Enforcement} {Finance, Audit & Commercial} {Legal, Risk & Compliance}
- [Serious Fraud Office (SFO) Trainee Investigator Programme](https://www.gov.uk/government/news/serious-fraud-office-launches-2025-trainee-investigator-programme) {Regulation & Enforcement} {Legal, Risk & Compliance}

### Departmental & policy schemes

- [Department of Health & Social Care (DHSC) Health Policy Fast Track Scheme](https://findajob.dwp.gov.uk/details/16299166) {Policy}
- [HM Treasury Graduate Programme](https://www.civil-service-careers.gov.uk/departments/working-for-hm-treasury/) {Policy} {Economics, Research & Analysis}
- [Home Office Digital, Data and Technology: Digital Development Programme](https://careers.homeoffice.gov.uk/news/were-recruiting-graduates-apprentices-and-fixed-term-associates-to-join-our-digital-and-data-programmes) {Digital, Data & Cyber}
- [Home Office Digital, Data and Technology: Dynamic Graduate Scheme](https://hodigital.blog.gov.uk/2025/06/25/graduates-accelerate-your-digital-and-data-career-on-our-dynamic-graduate-scheme/) {Digital, Data & Cyber}
- [Ministry of Defence Cost Assurance and Analysis Service (CAAS) Estimating Capability Development Scheme (ECDS)](https://www.linkedin.com/posts/gary-collier-estimating_cost-assurance-analysis-service-caas-activity-7321107097511751680-Y2hM) {Finance, Audit & Commercial} {Economics, Research & Analysis}
- [Yorkshire Development Scheme](https://justicejobs.tal.net/vx/mobile-0/appcentre-2/brand-2/candidate/so/pm/1/pl/1/opp/57710-57710-HR-Lead-and-Coach-of-the-Yorkshire-Development-Scheme#:~:text=The%20Yorkshire%20Development%20Programme%20is%20a%20joint%20initiative%20from%20the%20MoJ%20and%20DWP%20who,different%20roles.%20We%20expect%20them%20to%20compete%20for%20leadership%20roles%20at%20Grade%207%20Level) {Policy} {Operational Delivery & Public Services}

  Historically, only recruits via Fast Stream near-misses (the Direct Appointment Scheme)

## Armed Forces

- [British Army Regular Officer](https://jobs.army.mod.uk/regular-army/entry-options/officer/) {Generalist & Leadership} {Science, Engineering & Environment} {Health, Policing & Social Care Professions} {Digital, Data & Cyber} {Economics, Research & Analysis} {HR, Communications & Creative} {Legal, Risk & Compliance} {Project, Infrastructure & Property Management}
- [Royal Air Force graduates](https://recruitment.raf.mod.uk/graduates) {Generalist & Leadership} {Science, Engineering & Environment} {Health, Policing & Social Care Professions} {Economics, Research & Analysis} {HR, Communications & Creative} {Project, Infrastructure & Property Management} {Legal, Risk & Compliance}
- [Royal Navy graduates](https://www.royalnavy.mod.uk/careers/joining-options/graduates) {Generalist & Leadership} {Science, Engineering & Environment} {Health, Policing & Social Care Professions} {Project, Infrastructure & Property Management} {Economics, Research & Analysis} {Digital, Data & Cyber}

## Intelligence Services

- [MI5 (Security Service) graduate programmes](https://www.mi5.gov.uk/careers/opportunities/graduates) {Digital, Data & Cyber} {Economics, Research & Analysis}
- [MI6 (Secret Intelligence Service) Technology Graduate Development Programme](https://www.sis.gov.uk/careers/technologists/technology-graduate-development-programme) {Digital, Data & Cyber}

## Parliament and Oversight Bodies

- [Houses of Parliament Graduate Development Programme](https://www.parliament.uk/about/careers/graduate-programme/) {Policy}
- [National Audit Office (NAO) Chartered Accountancy Training Scheme](https://naoaccountancyscheme.co.uk) {Finance, Audit & Commercial}

## Agencies and Public Bodies

### Economic, financial & regulatory bodies

- [Bank of England graduate schemes](https://www.bankofengland.co.uk/careers/early-careers) {Finance, Audit & Commercial} {Economics, Research & Analysis} {Legal, Risk & Compliance} {Digital, Data & Cyber} {Regulation & Enforcement}
- [Financial Conduct Authority (FCA) graduate schemes](https://www.fca.org.uk/careers/early-careers) {Regulation & Enforcement}{Finance, Audit & Commercial} {Economics, Research & Analysis} {HR, Communications & Creative} {Digital, Data & Cyber}
- [Ofcom graduate programme](https://careers.ofcom.org.uk/careers/early-careers/graduate-programme/) {Policy} {Digital, Data & Cyber} {Economics, Research & Analysis} {Regulation & Enforcement} {Science, Engineering & Environment}
- [Ofgem Graduate Development Programme](https://www.ofgem.gov.uk/about-us/working-ofgem#heading-ofgem-graduate-development-programme) {Regulation & Enforcement} {Economics, Research & Analysis} {Policy} {Project, Infrastructure & Property Management} {Generalist & Leadership}
- [UK Government Investments (UKGI) graduate schemes](https://www.ukgi.org.uk/working-for-us/graduate-programme/) {Legal, Risk & Compliance} {Finance, Audit & Commercial} {Project, Infrastructure & Property Management} {Generalist & Leadership}
- [Valuation Office Agency graduate schemes](https://www.gov.uk/guidance/valuation-office-agency-graduate-scheme) {Project, Infrastructure & Property Management} {Finance, Audit & Commercial}

### Defence, security & nuclear

- [AWE Nuclear Security Technologies EVOLVE graduate programme](https://www.awe.co.uk/careers/early-careers/graduate-programme-evolve/) {Project, Infrastructure & Property Management} {Science, Engineering & Environment} {HR, Communications & Creative}
- [Defence Equipment & Support (DE&S) graduate schemes](https://des.mod.uk/careers/graduates-1/#graduate-section) {Finance, Audit & Commercial} {Science, Engineering & Environment} {Project, Infrastructure & Property Management}
- [Defence Science and Technology Laboratory (Dstl) graduate scheme](https://www.gov.uk/guidance/become-a-dstl-graduate-or-student) {Science, Engineering & Environment}
- [Nuclear Decommissioning Authority (NDA) group graduate programme](https://ndagroup.careers/early-careers/graduates/) {Science, Engineering & Environment} {Project, Infrastructure & Property Management} {Digital, Data & Cyber}
- [Nuclear Graduates](https://nucleargraduates.com/disciplines) {Science, Engineering & Environment} {Project, Infrastructure & Property Management} {Digital, Data & Cyber} {HR, Communications & Creative}
- [Submarine Delivery Agency (SDA) graduate schemes](https://www.gov.uk/government/publications/sda-graduate-schemes/sda-graduate-schemes) {Project, Infrastructure & Property Management} {Science, Engineering & Environment}
- [UK Atomic Energy Authority (UKAEA) Graduate Development Programme](https://careers.ukaea.uk/early-careers/graduate-scheme/) {Science, Engineering & Environment} {Digital, Data & Cyber}

### Infrastructure, transport & energy

- [HS2 graduate programme](https://mediacentre.hs2.org.uk/news/hs2-opens-recruitment-for-graduate-jobs) {Science, Engineering & Environment} {Finance, Audit & Commercial} {Project, Infrastructure & Property Management} {Digital, Data & Cyber}
- [National Highways graduate programmes](https://nationalhighways.co.uk/careers/career-programmes/graduate-programmes/) {Project, Infrastructure & Property Management} {Science, Engineering & Environment} {Digital, Data & Cyber} {Finance, Audit & Commercial} {Generalist & Leadership} {Legal, Risk & Compliance}
- [Network Rail graduate schemes](https://www.earlycareers.networkrail.co.uk/programme/graduate/) {Project, Infrastructure & Property Management} {Science, Engineering & Environment} {Finance, Audit & Commercial} {Digital, Data & Cyber} {Economics, Research & Analysis} {Operational Delivery & Public Services}
- [Vehicle Certification Agency Graduate Scheme](https://www.vehicle-certification-agency.gov.uk/careers/graduate/) {Science, Engineering & Environment} {Digital, Data & Cyber}

### Science, environment & technology

- [Environment Agency Environment and Science Graduate Training Scheme](https://environmentagencycareers.co.uk/current-opportunities/environment-and-science-graduate-training-scheme/) {Science, Engineering & Environment}
- [Forestry England Graduate Leadership Programme](https://www.forestryengland.uk/graduate-programme) {Generalist & Leadership} {Operational Delivery & Public Services}
- [Government Office for Science graduate internship scheme](https://governmentscienceandengineering.blog.gov.uk/2019/06/26/graduates-wanted-apply-now-for-the-2019-gos-internship-programme-3/) {Science, Engineering & Environment}
- [Met Office Graduate Development Scheme](https://careers.metoffice.gov.uk/early-careers/graduate-development-scheme) {Science, Engineering & Environment} {Digital, Data & Cyber} {HR, Communications & Creative}
- [Science and Technology Facilities Council (STFC) graduates](https://stfccareers.co.uk/graduates/) {Science, Engineering & Environment} {HR, Communications & Creative} {Digital, Data & Cyber} {Project, Infrastructure & Property Management}

### Health, safety & standards

- [Medicines & Healthcare products Regulatory Agency (MHRA) Graduate Scheme](https://www.gov.uk/government/publications/mhra-graduate-scheme/mhra-graduate-scheme) {Science, Engineering & Environment} {Regulation & Enforcement}

## Nations

### Northern Ireland

- [Northern Ireland Audit Office (NIAO) Trainee Accountant Scheme](https://www.niauditoffice.gov.uk/trainee-accountant-scheme) {Finance, Audit & Commercial}
- [Northern Ireland Civil Service (NICS) Graduate Management Programme](https://careers-ext.hrconnect.nigov.net) {Generalist & Leadership} {Policy}
- [Northern Ireland Housing Executive Graduate Trainees](https://www.nihe.gov.uk/careers/early-careers) {Digital, Data & Cyber} {HR, Communications & Creative} {Operational Delivery & Public Services} {Finance, Audit & Commercial} {Project, Infrastructure & Property Management}

### Scotland

- [Audit Scotland Graduate Trainee Auditor scheme](https://audit.scot/about-us/work-with-us/graduates) {Finance, Audit & Commercial}
- [Scottish Government Future Planners Programme](https://www.gov.scot/publications/future-planners-programme-2025-candidate-guide/pages/about-the-programme/) {Education & Planning}
- [Scottish Government Graduate Development Programme](https://www.jobs.gov.scot/early-careers) {Generalist & Leadership} {Policy}
- [Scottish Water Graduate Programmes](https://www.scottishwater.co.uk/about-us/careers/graduate-programmes) {Generalist & Leadership} {Science, Engineering & Environment} {Digital, Data & Cyber} {Finance, Audit & Commercial} {HR, Communications & Creative} {Project, Infrastructure & Property Management}

### Wales

- [All Wales Public Service Graduate Programme](https://academiwales.gov.wales/courses-and-events/programmes/all-wales-public-service-graduate-programme) {Generalist & Leadership} {Policy}
- [Audit Wales Graduate Trainee programme](https://www.audit.wales/jobs/graduate-scheme) {Finance, Audit & Commercial}

## Local Government

### National schemes

- [Impact: The Local Government Graduate Programme](https://www.local.gov.uk/impact-local-government-graduate-programme-candidates) {Generalist & Leadership} {Operational Delivery & Public Services} {Finance, Audit & Commercial}
- [Pathways to Planning](https://www.local.gov.uk/pathways-to-planning) {Education & Planning}

### Local and regional schemes

- [Basildon Council graduate programme](https://www.basildon.gov.uk/article/4342/Graduate-recruitment-at-Basildon-Council) {Generalist & Leadership} {Operational Delivery & Public Services}
- [Hertfordshire County Council graduate programme](https://jobs.hertfordshire.gov.uk/departments/grads-apprentices-and-work-experience/graduate-scheme-at-hertfordshire-county-council.aspx) {Generalist & Leadership} {Operational Delivery & Public Services}
- [Kent County Council Graduate Programme](https://jobs.kent.gov.uk/working-here/starting-your-career-with-us/kent-graduate-programme) {Generalist & Leadership} {Operational Delivery & Public Services}
- [North Yorkshire Council graduate scheme](https://www.northyorks.gov.uk/jobs-and-careers/our-apprenticeships-graduate-scheme-and-work-experience/our-graduate-scheme) {Generalist & Leadership} {Operational Delivery & Public Services}
- [Nottinghamshire County Council Graduate Development Programme](https://www.nottinghamshire.gov.uk/jobs-and-working/working-for-us/learning-and-development/graduate-development-programme) {Generalist & Leadership} {Operational Delivery & Public Services}
- [Rhondda Cynon Taff Council Graduate Programme](https://www.rctcbc.gov.uk/EN/Resident/JobsandTraining/Jobs/ApprenticeshipsGraduateSchemes/GraduateScheme/AbouttheGraduateProgramme.aspx) {Generalist & Leadership} {Operational Delivery & Public Services} {Project, Infrastructure & Property Management}
- [Richmond and Wandsworth Council Graduate Development Programme](https://recruitment.richmondandwandsworth.gov.uk/graduates/) {Generalist & Leadership} {Operational Delivery & Public Services}
- [Solihull Council graduate programmes](https://www.solihull.gov.uk/jobs-and-training/graduate-opportunities) {Operational Delivery & Public Services} {Economics, Research & Analysis} {Project, Infrastructure & Property Management} {HR, Communications & Creative}
- [Suffolk County Council graduate scheme](https://careers.suffolk.gov.uk/home/careers/early-careers/graduate-scheme) {Generalist & Leadership} {Operational Delivery & Public Services} {Project, Infrastructure & Property Management} {HR, Communications & Creative}
- [Suffolk Graduate Partnership](https://recruitment.westsuffolk.gov.uk/workforce/graduates.cfm) {Generalist & Leadership} {Operational Delivery & Public Services} {Project, Infrastructure & Property Management}
- [Transport for London graduate scheme](https://tfl.gov.uk/corporate/careers/graduates) {Generalist & Leadership} {Finance, Audit & Commercial} {Project, Infrastructure & Property Management} {Economics, Research & Analysis} {Science, Engineering & Environment} {Digital, Data & Cyber}

## Healthcare and the NHS

- [NHS England Scientist Training programme](https://www.nshcs.hee.nhs.uk/programmes/stp) {Health, Policing & Social Care Professions} {Science, Engineering & Environment}
- [NHS Graduate Management Training Scheme](https://graduates.nhs.uk) {Generalist & Leadership} {Health, Policing & Social Care Professions} {Finance, Audit & Commercial} {HR, Communications & Creative} {Digital, Data & Cyber} {Operational Delivery & Public Services}
- [NHS Scotland Management Training Scheme](https://www.mts.scot.nhs.uk) {Generalist & Leadership} {Health, Policing & Social Care Professions} {Operational Delivery & Public Services}
- [NHS South, Central and West (NHS SCW) graduate management programme](https://scwcsu.nhs.uk/work-for-us/graduate-scheme) {Generalist & Leadership} {Health, Policing & Social Care Professions} {Project, Infrastructure & Property Management}
- [NHS Wales Graduate Management Scheme](https://nhswalesleadershipportal.heiw.wales/graduate-programme) {Generalist & Leadership} {Health, Policing & Social Care Professions} {Operational Delivery & Public Services}

## Police

- [British Transport Police Graduate Programme](https://careers.btp.police.uk/roles/graduate-programme/) {Health, Policing & Social Care Professions} {Regulation & Enforcement} {Operational Delivery & Public Services}
- [National Crime Agency (NCA) Officer Development Programme (ODP)](https://www.nationalcrimeagency.gov.uk/careers/how-to-join-the-nca/entry-level-roles?view=article&id=3073:nca-officer-development-programme-odp&catid=10:careers) {Health, Policing & Social Care Professions} {Regulation & Enforcement} {Operational Delivery & Public Services}
- [Police Degree Holder Entry Programme (DHEP)](https://www.joiningthepolice.co.uk/application-process/ways-in-to-policing/degree-holder-entry-programme-dhep) {Health, Policing & Social Care Professions} {Regulation & Enforcement} {Operational Delivery & Public Services}
- [Police Now](http://www.policenow.org.uk/) {Health, Policing & Social Care Professions} {Regulation & Enforcement} {Operational Delivery & Public Services}
- [South Wales Police Graduate Programme](https://www.south-wales.police.uk/police-forces/south-wales-police/areas/careers/careers/staff-roles/graduate-opportunities/) {Health, Policing & Social Care Professions} {Regulation & Enforcement} {Operational Delivery & Public Services}

## Prisons & probation

- [HM Prison & Probation Service Trainee Probation Officer Programme (PQiP)](https://prisonandprobationjobs.gov.uk/roles-at-hmpps/overview-of-the-probation-officer-role/probation-officer-training-pqip/) {Health, Policing & Social Care Professions} {Operational Delivery & Public Services}
- [Unlocked](http://unlockedgrads.org.uk/) {Health, Policing & Social Care Professions} {Operational Delivery & Public Services}

## Social work

- [Approach Social Work (previously Frontline)](https://thefrontline.org.uk/become-a-social-worker/approach-social-work/) {Health, Policing & Social Care Professions} {Operational Delivery & Public Services}

## Teaching

- [TeachFirst](https://www.teachfirst.org.uk/) {Education & Planning} {Operational Delivery & Public Services}

## Public Corporations

- [BBC graduate schemes](https://careers.bbc.co.uk/content/EC_All-Pages/) {HR, Communications & Creative} {Legal, Risk & Compliance} {Digital, Data & Cyber}
- [Civil Aviation Authority graduates](https://careers.caa.co.uk/go/Career-Programmes/3745001/) {Science, Engineering & Environment} {Finance, Audit & Commercial}
- [National Nuclear Laboratory graduates](https://www.nnl.co.uk/careers/early-careers/graduates/) {Science, Engineering & Environment} {Project, Infrastructure & Property Management} {Digital, Data & Cyber}
- [National Physical Laboratory graduates](https://www.npl.co.uk/careers/graduates) {Science, Engineering & Environment}
- [Ordnance Survey graduate scheme](https://www.ordnancesurvey.co.uk/careers/graduate-scheme) {Digital, Data & Cyber} {Science, Engineering & Environment} {Economics, Research & Analysis}
<!-- site-content:end -->
