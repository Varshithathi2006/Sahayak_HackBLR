export interface AgriSubsidyForm {
  // Personal
  fullName?: string;
  age?: number;
  gender?: string;
  aadhaarNumber?: string;
  // Location
  village?: string;
  district?: string;
  state?: string;
  // Agricultural
  landSizeAcres?: number;
  cropType?: string;
  irrigationType?: string;
  // Financial
  annualIncome?: number;
  bankAccountNumber?: string;
  hasBusiness?: boolean;
  // Business (conditionally shown)
  businessName?: string;
  businessType?: string;
  businessIncome?: number;
}

export type FormFieldKey = keyof AgriSubsidyForm;

export interface FormSection {
  title: string;
  icon: string;
  fields: FieldConfig[];
  conditional?: { dependsOn: FormFieldKey; showWhen: unknown };
}

export interface FieldConfig {
  key: FormFieldKey;
  label: string;
  type: "text" | "number" | "boolean" | "select";
  icon: string;
  placeholder?: string;
}

export const FORM_SECTIONS: FormSection[] = [
  {
    title: "Personal Details",
    icon: "👤",
    fields: [
      { key: "fullName", label: "Full Name", type: "text", icon: "✍️", placeholder: "e.g. Ramesh Kumar" },
      { key: "age", label: "Age", type: "number", icon: "🎂", placeholder: "e.g. 42" },
      { key: "gender", label: "Gender", type: "text", icon: "⚤", placeholder: "e.g. Male / Female" },
      { key: "aadhaarNumber", label: "Aadhaar Number", type: "text", icon: "🪪", placeholder: "XXXX XXXX XXXX" },
    ],
  },
  {
    title: "Location",
    icon: "📍",
    fields: [
      { key: "village", label: "Village / Town", type: "text", icon: "🏘️", placeholder: "e.g. Hoskote" },
      { key: "district", label: "District", type: "text", icon: "🗺️", placeholder: "e.g. Bengaluru Rural" },
      { key: "state", label: "State", type: "text", icon: "🌏", placeholder: "e.g. Karnataka" },
    ],
  },
  {
    title: "Agricultural Details",
    icon: "🌾",
    fields: [
      { key: "landSizeAcres", label: "Land Size (Acres)", type: "number", icon: "🌱", placeholder: "e.g. 3.5" },
      { key: "cropType", label: "Crop Type", type: "text", icon: "🌽", placeholder: "e.g. Paddy, Sugarcane" },
      { key: "irrigationType", label: "Irrigation Type", type: "text", icon: "💧", placeholder: "e.g. Borewell, Canal" },
    ],
  },
  {
    title: "Financial Details",
    icon: "💰",
    fields: [
      { key: "annualIncome", label: "Annual Income (₹)", type: "number", icon: "📊", placeholder: "e.g. 85000" },
      { key: "bankAccountNumber", label: "Bank Account Number", type: "text", icon: "🏦", placeholder: "e.g. 3425..." },
      { key: "hasBusiness", label: "Runs a Business", type: "boolean", icon: "🏪", placeholder: "Yes / No" },
    ],
  },
  {
    title: "Business Details",
    icon: "🏪",
    conditional: { dependsOn: "hasBusiness", showWhen: true },
    fields: [
      { key: "businessName", label: "Business Name", type: "text", icon: "🏷️", placeholder: "e.g. Ramu Provision Store" },
      { key: "businessType", label: "Business Type", type: "text", icon: "⚙️", placeholder: "e.g. Grocery, Dairy" },
      { key: "businessIncome", label: "Business Income (₹/yr)", type: "number", icon: "💵", placeholder: "e.g. 120000" },
    ],
  },
];
