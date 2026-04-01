export interface Pet {
  id: string;
  type: "cat" | "dog";
  breed_visual?: string;
  name: string;
  sex?: string;
  description?: string;
  age_months?: number;
  size?: string;
  weight_kg?: number;
  color?: string;
  sterilized?: boolean;
  temperament_tags?: string[];
  health_status?: string;
  medical_conditions?: string;
  ideal_owner_tags?: string[];
  photo_url?: string;
  monthly_cost?: number;
  status?: "available" | "trial" | "adopted";

  // TVL backward compatibility
  age?: string;
  breed?: string;
  temperament?: string;
  imageUrl?: string;
  estimatedCost?: number;
  timeNeeded?: string;
  costBreakdown?: {
    food: number;
    medical: number;
    other: number;
  };
}

export interface AdoptionFormData {
  fullName: string;
  phone: string;
  address: string;
  date: string;
  time: string;
  hasChildren: boolean;
  hasOtherPets: boolean;
  understandsCommitment: boolean;
}

export type AdoptionType = "trial" | "adoption";