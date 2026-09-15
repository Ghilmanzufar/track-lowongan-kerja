// JobTrack Web Clipper - Content Script
// Extracts job details from popular job portals (LinkedIn, Glints, Jobstreet, Kalibrr, Indeed, etc.)

function extractJobData() {
  const url = window.location.href;
  const hostname = window.location.hostname;

  let title = '';
  let companyName = '';
  let location = '';
  let workType = 'onsite';
  let salaryMin = null;
  let salaryMax = null;
  let notes = '';

  // 1. LinkedIn
  if (hostname.includes('linkedin.com')) {
    title = document.querySelector('.job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title, h1.t-24')?.textContent?.trim() || '';
    companyName = document.querySelector('.job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name, .job-details-jobs-unified-top-card__primary-description a')?.textContent?.trim() || '';
    location = document.querySelector('.job-details-jobs-unified-top-card__bullet, .jobs-unified-top-card__bullet')?.textContent?.trim() || '';
    
    const desc = document.querySelector('#job-details, .jobs-description-content__text')?.innerText?.trim() || '';
    if (desc) notes = `Deskripsi Singkat:\n${desc.slice(0, 500)}...`;
  }
  // 2. Glints
  else if (hostname.includes('glints.com')) {
    title = document.querySelector('h1[class*="JobTitle"], h1')?.textContent?.trim() || '';
    companyName = document.querySelector('a[class*="CompanyName"], [class*="CompanyCard"] h2')?.textContent?.trim() || '';
    location = document.querySelector('[class*="JobLocation"], [class*="Location"]')?.textContent?.trim() || '';
  }
  // 3. Jobstreet / Seek
  else if (hostname.includes('jobstreet.') || hostname.includes('seek.')) {
    title = document.querySelector('[data-automation="job-detail-title"], h1')?.textContent?.trim() || '';
    companyName = document.querySelector('[data-automation="advertiser-name"], [data-automation="jobCompany"]')?.textContent?.trim() || '';
    location = document.querySelector('[data-automation="job-detail-location"]')?.textContent?.trim() || '';
  }
  // 4. Indeed
  else if (hostname.includes('indeed.com')) {
    title = document.querySelector('.jobsearch-JobInfoHeader-title, h1')?.textContent?.trim() || '';
    companyName = document.querySelector('[data-testid="inlineHeader-companyName"]')?.textContent?.trim() || '';
    location = document.querySelector('[data-testid="inlineHeader-companyLocation"]')?.textContent?.trim() || '';
  }
  // 5. Kalibrr
  else if (hostname.includes('kalibrr.com')) {
    title = document.querySelector('h1')?.textContent?.trim() || '';
    companyName = document.querySelector('h2 a, .k-text-subdued a')?.textContent?.trim() || '';
    location = document.querySelector('.k-text-subdued')?.textContent?.trim() || '';
  }

  // 6. Generic Meta & OpenGraph Fallback
  if (!title) {
    title = document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
            document.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
            document.title || '';
    // Clean common title suffixes like " - Jobstreet", " | LinkedIn"
    title = title.replace(/\s*([|–—-])\s*(LinkedIn|Glints|Jobstreet|Indeed|Kalibrr).*$/i, '').trim();
  }

  if (!companyName) {
    companyName = document.querySelector('meta[property="og:site_name"]')?.getAttribute('content') || '';
  }

  // Detect Remote / Hybrid in page content
  const pageText = (title + ' ' + location + ' ' + (document.body?.innerText?.slice(0, 1000) || '')).toLowerCase();
  if (pageText.includes('remote') || pageText.includes('jarak jauh') || pageText.includes('wfh')) {
    workType = 'remote';
  } else if (pageText.includes('hybrid')) {
    workType = 'hybrid';
  }

  return {
    title: title.slice(0, 150),
    companyName: companyName.slice(0, 100),
    location: location.slice(0, 100),
    sourceUrl: url,
    workType: workType,
    salaryMin: salaryMin,
    salaryMax: salaryMax,
    notes: notes
  };
}

// Listen for popup requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'EXTRACT_JOB_DETAILS') {
    const data = extractJobData();
    sendResponse(data);
  }
  return true;
});
