// src/lib/customers/intakeTypes.ts
// Plain shared constants/types for the intake flow. Kept OUT of the 'use server'
// file because Next.js only allows async function exports from server modules —
// non-function exports (like CONTACT_TITLES) get stripped and arrive undefined.

export const CONTACT_TITLES = ['בעל הנכס', 'מפקח', 'אדריכל', 'מעצב פנים', 'קבלן', 'איש קשר ראשי', 'אחר'] as const;
export type ContactTitle = typeof CONTACT_TITLES[number];

export interface IntakeContact {
  name:      string;
  title:     ContactTitle;
  phone?:    string;
  email?:    string;
  isPrimary: boolean;
}

export interface CreateIntakeInput {
  accountName:        string;
  city?:              string;
  source?:            string;
  notes?:             string;
  contacts:           IntakeContact[];
  projectTitle:       string;
  projectStone?:      string;
  projectDimensions?: string;
}

export interface IntakeResult {
  ok:          boolean;
  error?:      string;
  customerId?: string;
  projectId?:  string;
}

export interface ContactRow {
  id:         string;
  name:       string;
  title:      string;
  phone:      string | null;
  email:      string | null;
  is_primary: boolean;
}
