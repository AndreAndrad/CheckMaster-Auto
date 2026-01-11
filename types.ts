
export enum FieldType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  CHECKBOX = 'CHECKBOX',
  PLATE = 'PLATE', // Special field for AI OCR
  IMEI = 'IMEI',    // Special field for AI OCR
  SELECT = 'SELECT', // Single choice from a list
  MULTIPLE = 'MULTIPLE', // Multiple choices from a list
  VEHICLE_INFO = 'VEHICLE_INFO', // Specialized field for Type/Brand/Model
  IMAGE = 'IMAGE', // Specific photo field (e.g., "Front View")
  CURRENCY = 'CURRENCY' // Manual price input field
}

export interface FieldOption {
  label: string;
  price?: number;
}

export interface ChecklistField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  value?: string | number | boolean | string[];
  options?: FieldOption[];
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  fields: ChecklistField[];
  isFavorite?: boolean; // New: Flag for quick access
}

export interface ChecklistEntry {
  id: string;
  templateId: string;
  templateName: string;
  timestamp: number;
  data: Record<string, any>;
  photos: string[]; // Global gallery
  totalValue: number; // Sum of all prices in this entry
}

export interface AIExtractionResult {
  plate?: string;
  model?: string;
  imei?: string;
  brand?: string;
  serial?: string;
}
