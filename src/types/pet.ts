export interface Pet {
  id: string;
  name: string;
  age: string;
  breed: string;
  type: "cat" | "dog";
  temperament: string;
  imageUrl: string;
  estimatedCost: number;
  timeNeeded: string;
  costBreakdown: {
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