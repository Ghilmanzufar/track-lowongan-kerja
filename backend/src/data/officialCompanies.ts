/**
 * Master Data Direktori Perusahaan & Instansi Terkemuka Jabodetabek & Indonesia
 * Terkurasi resmi: BUMN, Konglomerasi Swasta, Startup Unicorn & Decacorn,
 * Perusahaan Multinasional Terkemuka, serta Regulator Keuangan & Kementerian RI.
 */

import { CareerLinkCategory } from '@prisma/client';
import { BANKING_FINANCE_COMPANIES } from './companies/bankingFinance.js';
import { TECH_DIGITAL_COMPANIES } from './companies/techDigital.js';
import { FMCG_CONSUMER_COMPANIES } from './companies/fmcgConsumer.js';
import { MANUFACTURING_AUTO_COMPANIES } from './companies/manufacturingAuto.js';
import { ELECTRONICS_TECH_HARDWARE_COMPANIES } from './companies/electronicsTechHardware.js';
import { ENERGY_MINING_COMPANIES } from './companies/energyMining.js';
import { PHARMA_HEALTHCARE_COMPANIES } from './companies/pharmaHealthcare.js';
import { PROFESSIONAL_LEGAL_COMPANIES } from './companies/professionalLegal.js';
import { PROPERTY_INFRASTRUCTURE_COMPANIES } from './companies/propertyInfrastructure.js';
import { RETAIL_LIFESTYLE_COMPANIES } from './companies/retailLifestyle.js';
import { LOGISTICS_TRANSPORT_COMPANIES } from './companies/logisticsTransport.js';
import { TELCO_MEDIA_COMPANIES } from './companies/telcoMedia.js';
import { BUMN_GOVERNMENT_COMPANIES } from './companies/bumnGovernment.js';

export interface OfficialCompanyItem {
  name: string;
  category: CareerLinkCategory;
  sector: string;
  url: string;
  logoUrl?: string;
  description?: string;
}

const ALL_COMPANIES_RAW: OfficialCompanyItem[] = [
  ...BANKING_FINANCE_COMPANIES,
  ...TECH_DIGITAL_COMPANIES,
  ...FMCG_CONSUMER_COMPANIES,
  ...MANUFACTURING_AUTO_COMPANIES,
  ...ELECTRONICS_TECH_HARDWARE_COMPANIES,
  ...ENERGY_MINING_COMPANIES,
  ...PHARMA_HEALTHCARE_COMPANIES,
  ...PROFESSIONAL_LEGAL_COMPANIES,
  ...PROPERTY_INFRASTRUCTURE_COMPANIES,
  ...RETAIL_LIFESTYLE_COMPANIES,
  ...LOGISTICS_TRANSPORT_COMPANIES,
  ...TELCO_MEDIA_COMPANIES,
  ...BUMN_GOVERNMENT_COMPANIES,
];

// Deduplikasi berdasarkan Nama Perusahaan
function deduplicateCompanies(items: OfficialCompanyItem[]): OfficialCompanyItem[] {
  const seenNames = new Set<string>();
  const result: OfficialCompanyItem[] = [];

  for (const item of items) {
    const normName = item.name.trim().toLowerCase();

    if (!seenNames.has(normName)) {
      seenNames.add(normName);
      result.push(item);
    }
  }

  return result;
}

export const OFFICIAL_INDONESIAN_COMPANIES: OfficialCompanyItem[] = deduplicateCompanies(ALL_COMPANIES_RAW);
