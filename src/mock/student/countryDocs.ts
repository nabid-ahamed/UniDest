// Documents shown on the student "Country Information" pages, grouped by
// category. The country list itself comes from the CMS Countries module
// (mock/cms.ts → cmsCountries); this file supplies the per-country document
// set. Modeled on demo.eductrl.com/cn4/hostcountryinfo.
// Docs: docs/superpowers/mock-data/student.md.

export interface CountryDoc {
  title: string
  fileType: string // e.g. "PDF"
}

export interface CountryDocCategory {
  category: string
  documents: CountryDoc[]
}

/**
 * Document categories + documents for a destination country. Generated per
 * country (titles reference the country where relevant), so every CMS country
 * gets a consistent, dynamic document set.
 */
export function countryDocuments(countryName: string): CountryDocCategory[] {
  return [
    {
      category: 'General Information',
      documents: [
        { title: 'General Presentation', fileType: 'PDF' },
        { title: `Studying in ${countryName} — Overview`, fileType: 'PDF' },
      ],
    },
    {
      category: 'Visa Documents',
      documents: [
        { title: 'Student Visa Checklist', fileType: 'PDF' },
        { title: 'Visa Application Guide', fileType: 'PDF' },
      ],
    },
    {
      category: 'Living & Costs',
      documents: [
        { title: 'Cost of Living Guide', fileType: 'PDF' },
        { title: 'Accommodation Guide', fileType: 'PDF' },
      ],
    },
    {
      category: 'Scholarships',
      documents: [{ title: `Scholarship Opportunities in ${countryName}`, fileType: 'PDF' }],
    },
  ]
}
