// English / Bangla strings. Missing Bangla keys fall back to English.
const en = {
  appTitle: 'Deposit Calculator', bank: 'PUBALI BANK PLC', home: 'Home', details: 'Details', settings: 'Settings', back: 'Back',
  dps: 'DPS', dpsFull: 'Deposit Pension Scheme', fdr: 'FDR', fdrFull: 'Fixed Deposit Receipt', tbsd: 'TBSD', tbsdFull: 'Term-Based Special Deposit',
  lastResult: 'Last Result', language: 'বাংলা', pickProduct: 'Choose a deposit product',
  estimateBanner: 'Estimates only. Actual bank-posted amounts may differ.',
  estimateNote: 'This is an estimate based on the settings in this app. Actual amounts posted by the bank (rates, tax, excise duty, rounding) may differ. Please confirm with your branch.',
  // fields
  monthlyInstallment: 'Monthly Installment', monthlyDeposit: 'Monthly Deposit Amount', initialDeposit: 'Initial Deposit Amount',
  rate: 'Annual Interest Rate (%)', rateHint: 'Pre-filled from Settings (illustrative until you set the bank rate). You can edit it.',
  tenure: 'Tenure', years: 'Years', months: 'Months', year: 'Year', month: 'Month', tenureYears: 'Tenure (Years)', tenureMonths: 'Tenure (Months)',
  taxStatus: 'Tax Return Status', submitted: 'Submitted', notSubmitted: 'Not Submitted',
  openingDate: 'Account Opening Date', installmentDay: 'Installment Day of Month (optional)', installmentDayHint: 'Leave blank to pay on the opening-date day each month.',
  autoRenewal: 'Auto Renewal', yes: 'Yes', no: 'No', renewals: 'Number of Renewals', renewalMethod: 'Renewal Method', renewalRate: 'Renewal Interest Rate (%)',
  rm_principal_only: 'Principal only', rm_principal_interest: 'Principal + interest', rm_principal_net_interest: 'Principal + net interest (after tax)',
  method: 'Interest Method', simple: 'Simple Interest', compound: 'Compound Interest', compounding: 'Compounding Frequency',
  cmMonthly: 'Monthly', cmQuarterly: 'Quarterly', cmHalf: 'Half-yearly', cmYearly: 'Yearly', cmSimple: 'Simple (no compounding)',
  depositMode: 'Deposit Mode', modeMonthly: 'Monthly Deposit', modeOnetime: 'One-Time Deposit',
  // results
  grossAmount: 'Gross Amount', less: 'Less', sourceTax: 'Source Tax', exciseDuty: 'Excise Duty', otherCharges: 'Other Applicable Charges',
  totalDeduction: 'Total Deduction', takeHome: 'Final Take-Home Amount', viewDetails: 'View Calculation Details',
  principal: 'Total Principal Deposited', grossInterest: 'Total Gross Interest', grossMaturity: 'Gross Maturity Amount',
  netInterestPaid: 'Total Net Monthly Interest Paid', finalPrincipal: 'Final Principal Payable (after excise)',
  maturityDate: 'Maturity Date', taxRateApplied: 'Source Tax Rate Applied', installments: 'Installments',
  // details
  tabSummary: 'Summary', tabMonthly: 'Monthly Details', tabPeriods: 'Period Details', tabYearly: 'Yearly Details', tabTax: 'Tax & Excise Duty',
  colMonth: 'Month', colDate: 'Date', colInstallment: 'Installment', colOpening: 'Opening Balance', colInterest: 'Interest', colClosing: 'Closing Balance',
  colPeriod: 'Period', colOpeningPrincipal: 'Opening Principal', colTax: 'Tax', colRenewal: 'Renewal Amount', colRenewalFinal: 'Renewal / Final Payout',
  colDeposit: 'Deposit', colGrossInt: 'Gross Interest', colNetInt: 'Net Interest Paid', colBalance: 'Balance',
  colYear: 'Year', colInstTotal: 'Total Installments', colAccInterest: 'Accumulated Interest', colNetAcc: 'Net Accumulated',
  colPeak: 'Highest Balance', colDuty: 'Excise Duty', colPrincipalAdded: 'Principal Added',
  methodUsed: 'Method used', mCompounding: 'Interest capitalised', mSimple: 'Simple interest', mEveryN: 'every {n} month(s)',
  mDayCount: 'Day count', dcMonthly: 'Monthly (rate/12)', dcActual: 'Actual days / year days', mTaxTiming: 'Source tax deducted',
  tt_maturity: 'At maturity, on total interest', tt_monthly: 'From each monthly interest payment', tt_each_term: 'At each term',
  mExciseBasis: 'Excise duty balance basis', eb_principal: 'Principal only', eb_principal_plus_interest: 'Principal + accrued interest',
  mRounding: 'Rounding', print: 'Print / Save PDF', csv: 'Download CSV', noResult: 'No calculation yet. Open a calculator and enter the details.',
  statement: 'Deposit Calculation Statement', generatedOn: 'Generated on', inputs: 'Inputs', interestDetail: 'Interest Calculation',
  taxDetail: 'Tax Deduction', exciseDetail: 'Excise Duty (one per calendar year)', maturityDetail: 'Maturity Amount Calculation',
  tbsdNote: 'TBSD interest is paid every month and is NOT part of the final principal.', fdrFinal: 'final term',
  // errors
  err_amount_invalid: 'Enter a valid amount greater than zero.', err_amount_min: 'Amount is below the minimum.', err_amount_max: 'Amount is above the maximum.',
  err_rate_invalid: 'Enter a valid interest rate.', err_date_invalid: 'Enter a valid date.', err_tenure_invalid: 'Choose a valid tenure.',
  err_day_invalid: 'Installment day must be 1 to 31.', err_renewals_invalid: 'Number of renewals is too large.',
  // settings
  sRates: 'Interest Rates', sRatesNote: 'Placeholder rates until you enter the bank’s current rates.', sTax: 'Source Tax (%)', sExcise: 'Excise Duty Slabs (BDT)',
  sUpTo: 'Up to (BDT)', sDuty: 'Duty (BDT)', sNoLimit: 'blank = no limit', sAddSlab: 'Add slab', sMethods: 'Calculation Methods', sRounding: 'Rounding',
  sRoundMode: 'Rounding mode', sRoundUnit: 'Round to', ru_paisa: 'Paisa', ru_taka: 'Whole taka', rmode_half_up: 'Half up', rmode_floor: 'Round down', rmode_ceil: 'Round up', rmode_bankers: 'Banker’s',
  sDefaults: 'Default Tenures', sOther: 'Other Applicable Charges (flat, BDT)', sLimits: 'Deposit Limits (BDT)', sMin: 'Min', sMax: 'Max',
  sTbsdTenures: 'TBSD tenure options (months, comma separated)', sReset: 'Reset to defaults', sSaved: 'Saved on this device',
  sDpsCm: 'DPS interest capitalisation', sDpsDc: 'DPS day count', sFdrCm: 'FDR default compounding', sFdrDc: 'FDR day count', sTbsdDc: 'TBSD day count', sExBasis: 'Excise duty balance basis',
  sConfirmReset: 'Reset all settings to defaults?',
};

const bn = {
  appTitle: 'ডিপোজিট ক্যালকুলেটর', bank: 'পূবালী ব্যাংক পিএলসি', home: 'হোম', details: 'বিস্তারিত', settings: 'সেটিংস', back: 'পিছনে',
  dps: 'ডিপিএস', dpsFull: 'ডিপোজিট পেনশন স্কিম', fdr: 'এফডিআর', fdrFull: 'ফিক্সড ডিপোজিট রিসিপ্ট', tbsd: 'টিবিএসডি', tbsdFull: 'টার্ম-বেইজড স্পেশাল ডিপোজিট',
  lastResult: 'সর্বশেষ ফলাফল', language: 'English', pickProduct: 'ডিপোজিট পণ্য বেছে নিন',
  estimateBanner: 'এটি শুধুমাত্র আনুমানিক হিসাব। ব্যাংকের প্রকৃত হিসাব ভিন্ন হতে পারে।',
  estimateNote: 'এই হিসাব অ্যাপের সেটিংসের উপর ভিত্তি করে আনুমানিক। ব্যাংকের প্রকৃত পোস্ট করা পরিমাণ (সুদের হার, কর, আবগারি শুল্ক, রাউন্ডিং) ভিন্ন হতে পারে। অনুগ্রহ করে শাখায় নিশ্চিত হয়ে নিন।',
  monthlyInstallment: 'মাসিক কিস্তি', monthlyDeposit: 'মাসিক জমার পরিমাণ', initialDeposit: 'প্রাথমিক জমার পরিমাণ',
  rate: 'বার্ষিক সুদের হার (%)', rateHint: 'সেটিংস থেকে স্বয়ংক্রিয়ভাবে বসানো (ব্যাংকের হার বসানো পর্যন্ত নমুনা)। আপনি পরিবর্তন করতে পারেন।',
  tenure: 'মেয়াদ', years: 'বছর', months: 'মাস', year: 'বছর', month: 'মাস', tenureYears: 'মেয়াদ (বছর)', tenureMonths: 'মেয়াদ (মাস)',
  taxStatus: 'রিটার্ন জমার অবস্থা', submitted: 'জমা দেওয়া হয়েছে', notSubmitted: 'জমা দেওয়া হয়নি',
  openingDate: 'হিসাব খোলার তারিখ', installmentDay: 'কিস্তির তারিখ (মাসের দিন, ঐচ্ছিক)', installmentDayHint: 'ফাঁকা রাখলে প্রতি মাসে হিসাব খোলার দিনেই কিস্তি ধরা হবে।',
  autoRenewal: 'অটো রিনিউয়াল', yes: 'হ্যাঁ', no: 'না', renewals: 'রিনিউয়ালের সংখ্যা', renewalMethod: 'রিনিউয়াল পদ্ধতি', renewalRate: 'রিনিউয়াল সুদের হার (%)',
  rm_principal_only: 'শুধু আসল', rm_principal_interest: 'আসল + সুদ', rm_principal_net_interest: 'আসল + নিট সুদ (কর কাটার পর)',
  method: 'সুদ গণনা পদ্ধতি', simple: 'সরল সুদ', compound: 'চক্রবৃদ্ধি সুদ', compounding: 'চক্রবৃদ্ধির ব্যবধান',
  cmMonthly: 'মাসিক', cmQuarterly: 'ত্রৈমাসিক', cmHalf: 'ষান্মাসিক', cmYearly: 'বার্ষিক', cmSimple: 'সরল (চক্রবৃদ্ধি নয়)',
  depositMode: 'জমার ধরন', modeMonthly: 'মাসিক জমা', modeOnetime: 'এককালীন জমা',
  grossAmount: 'মোট পরিমাণ (গ্রস)', less: 'বিয়োগ', sourceTax: 'উৎস কর', exciseDuty: 'আবগারি শুল্ক', otherCharges: 'অন্যান্য প্রযোজ্য চার্জ',
  totalDeduction: 'মোট কর্তন', takeHome: 'চূড়ান্ত হাতে পাওয়া পরিমাণ', viewDetails: 'হিসাবের বিস্তারিত দেখুন',
  principal: 'মোট জমাকৃত আসল', grossInterest: 'মোট সুদ (গ্রস)', grossMaturity: 'মেয়াদপূর্তিতে মোট (গ্রস)',
  netInterestPaid: 'মোট নিট মাসিক সুদ প্রদান', finalPrincipal: 'চূড়ান্ত আসল প্রদেয় (শুল্ক কর্তনের পর)',
  maturityDate: 'মেয়াদপূর্তির তারিখ', taxRateApplied: 'প্রযোজ্য উৎস করের হার', installments: 'কিস্তির সংখ্যা',
  tabSummary: 'সারসংক্ষেপ', tabMonthly: 'মাসিক বিবরণ', tabPeriods: 'মেয়াদভিত্তিক বিবরণ', tabYearly: 'বার্ষিক বিবরণ', tabTax: 'কর ও আবগারি শুল্ক',
  colMonth: 'মাস', colDate: 'তারিখ', colInstallment: 'কিস্তি', colOpening: 'প্রারম্ভিক জমা', colInterest: 'সুদ', colClosing: 'সমাপনী জমা',
  colPeriod: 'মেয়াদ', colOpeningPrincipal: 'প্রারম্ভিক আসল', colTax: 'কর', colRenewal: 'রিনিউয়াল অঙ্ক', colRenewalFinal: 'রিনিউয়াল / চূড়ান্ত প্রদান',
  colDeposit: 'জমা', colGrossInt: 'গ্রস সুদ', colNetInt: 'নিট সুদ প্রদান', colBalance: 'স্থিতি',
  colYear: 'সাল', colInstTotal: 'মোট কিস্তি', colAccInterest: 'পুঞ্জিভূত সুদ', colNetAcc: 'নিট পুঞ্জিভূত',
  colPeak: 'সর্বোচ্চ স্থিতি', colDuty: 'আবগারি শুল্ক', colPrincipalAdded: 'যুক্ত আসল',
  methodUsed: 'ব্যবহৃত পদ্ধতি', mCompounding: 'সুদ আসলে যুক্ত হয়', mSimple: 'সরল সুদ', mEveryN: 'প্রতি {n} মাসে',
  mDayCount: 'দিন গণনা', dcMonthly: 'মাসিক (হার/১২)', dcActual: 'প্রকৃত দিন / বছরের দিন', mTaxTiming: 'উৎস কর কর্তন',
  tt_maturity: 'মেয়াদপূর্তিতে, মোট সুদের উপর', tt_monthly: 'প্রতি মাসের সুদ থেকে', tt_each_term: 'প্রতিটি মেয়াদে',
  mExciseBasis: 'আবগারি শুল্কের স্থিতির ভিত্তি', eb_principal: 'শুধু আসল', eb_principal_plus_interest: 'আসল + জমে থাকা সুদ',
  mRounding: 'রাউন্ডিং', print: 'প্রিন্ট / পিডিএফ', csv: 'সিএসভি ডাউনলোড', noResult: 'এখনও কোনো হিসাব নেই। একটি ক্যালকুলেটর খুলে তথ্য দিন।',
  statement: 'ডিপোজিট হিসাব বিবরণী', generatedOn: 'তৈরির তারিখ', inputs: 'ইনপুট', interestDetail: 'সুদের হিসাব',
  taxDetail: 'কর কর্তন', exciseDetail: 'আবগারি শুল্ক (প্রতি পঞ্জিকা বছরে একবার)', maturityDetail: 'মেয়াদপূর্তির অঙ্কের হিসাব',
  tbsdNote: 'টিবিএসডি-র সুদ প্রতি মাসে প্রদান করা হয় এবং তা চূড়ান্ত আসলের অংশ নয়।', fdrFinal: 'শেষ মেয়াদ',
  err_amount_invalid: 'শূন্যের চেয়ে বেশি সঠিক পরিমাণ দিন।', err_amount_min: 'পরিমাণ সর্বনিম্ন সীমার নিচে।', err_amount_max: 'পরিমাণ সর্বোচ্চ সীমার বেশি।',
  err_rate_invalid: 'সঠিক সুদের হার দিন।', err_date_invalid: 'সঠিক তারিখ দিন।', err_tenure_invalid: 'সঠিক মেয়াদ বেছে নিন।',
  err_day_invalid: 'কিস্তির দিন ১ থেকে ৩১ হতে হবে।', err_renewals_invalid: 'রিনিউয়ালের সংখ্যা অনেক বেশি।',
  sRates: 'সুদের হার', sRatesNote: 'ব্যাংকের বর্তমান হার না বসানো পর্যন্ত এগুলো নমুনা হার।', sTax: 'উৎস কর (%)', sExcise: 'আবগারি শুল্কের স্তর (টাকা)',
  sUpTo: 'সর্বোচ্চ (টাকা)', sDuty: 'শুল্ক (টাকা)', sNoLimit: 'ফাঁকা = সীমাহীন', sAddSlab: 'স্তর যোগ করুন', sMethods: 'হিসাব পদ্ধতি', sRounding: 'রাউন্ডিং',
  sRoundMode: 'রাউন্ডিং পদ্ধতি', sRoundUnit: 'রাউন্ড করার একক', ru_paisa: 'পয়সা', ru_taka: 'পূর্ণ টাকা', rmode_half_up: 'অর্ধেক হলে উপরে', rmode_floor: 'নিচে', rmode_ceil: 'উপরে', rmode_bankers: 'ব্যাংকার্স',
  sDefaults: 'ডিফল্ট মেয়াদ', sOther: 'অন্যান্য প্রযোজ্য চার্জ (নির্দিষ্ট, টাকা)', sLimits: 'জমার সীমা (টাকা)', sMin: 'সর্বনিম্ন', sMax: 'সর্বোচ্চ',
  sTbsdTenures: 'টিবিএসডি মেয়াদের বিকল্প (মাস, কমা দিয়ে)', sReset: 'ডিফল্টে ফিরুন', sSaved: 'এই ডিভাইসে সংরক্ষিত',
  sDpsCm: 'ডিপিএস সুদ যুক্ত হওয়ার ব্যবধান', sDpsDc: 'ডিপিএস দিন গণনা', sFdrCm: 'এফডিআর ডিফল্ট চক্রবৃদ্ধি', sFdrDc: 'এফডিআর দিন গণনা', sTbsdDc: 'টিবিএসডি দিন গণনা', sExBasis: 'আবগারি শুল্কের স্থিতির ভিত্তি',
  sConfirmReset: 'সব সেটিংস ডিফল্টে ফিরিয়ে নেবেন?',
};

let lang = 'en';
try { lang = localStorage.getItem('pbdc.lang') || 'en'; } catch (e) { /* ignore */ }
export const getLang = () => lang;
export function setLang(l) { lang = l; try { localStorage.setItem('pbdc.lang', l); } catch (e) { /* ignore */ } document.documentElement.lang = l; }
export function t(key, params) {
  let s = (lang === 'bn' ? bn[key] : undefined) ?? en[key] ?? key;
  if (params) for (const [k, v] of Object.entries(params)) s = s.replace(`{${k}}`, v);
  return s;
}
