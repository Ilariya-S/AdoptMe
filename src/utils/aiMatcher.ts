import { Pet } from "../types/pet";

export interface MatchResult {
  pet: Pet | null;
  reason: string;
  followUpQuestion: string | null;
  needsMoreInfo: boolean;
}

export function matchPet(userInput: string, availablePets: Pet[]): MatchResult {
  const input = userInput.toLowerCase();
  
  // Check if user mentioned children
  const hasChildren = input.includes("діт") || input.includes("дитин");
  
  // Check living situation
  const isApartment = input.includes("квартир");
  
  // Check budget
  const budgetMatch = input.match(/(\d+)\s*грн/);
  const budget = budgetMatch ? parseInt(budgetMatch[1] ?? "0", 10) : null;
  
  // Check if user wants cat or dog specifically
  const wantsCat = input.includes("кіт") || input.includes("кішка") || input.includes("кота");
  const wantsDog = input.includes("собак") || input.includes("пес") || input.includes("пса");
  
  // Follow-up if missing critical info
  if (!hasChildren && !input.includes("один") && !input.includes("сам")) {
    return {
      pet: null,
      reason: "",
      followUpQuestion: "Чи є у вас діти? Це допоможе нам підібрати найкращого улюбленця.",
      needsMoreInfo: true,
    };
  }
  
  // Filter pets based on criteria
  let filteredPets = [...availablePets];
  
  // Filter by type preference
  if (wantsCat && !wantsDog) {
    filteredPets = filteredPets.filter(p => p.type === "cat");
  } else if (wantsDog && !wantsCat) {
    filteredPets = filteredPets.filter(p => p.type === "dog");
  }
  
  // Filter by budget
  if (budget) {
    filteredPets = filteredPets.filter(p => (p.monthly_cost ?? p.estimatedCost ?? 0) <= budget);
  }
  
  // Filter by living situation
  if (isApartment) {
    // Prefer cats and smaller dogs for apartments
    filteredPets = filteredPets.sort((a, b) => {
      if (a.type === "cat" && b.type === "dog") return -1;
      if (a.type === "dog" && b.type === "cat") return 1;
      return (a.monthly_cost ?? a.estimatedCost ?? 0) - (b.monthly_cost ?? b.estimatedCost ?? 0);
    });
  }
  
  // If user has children, prefer family-friendly pets
  if (hasChildren) {
    filteredPets = filteredPets.filter(p => {
      const temperamentText = Array.isArray(p.temperament_tags)
        ? p.temperament_tags.join(" ")
        : p.temperament || "";
      return temperamentText.toLowerCase().includes("дітей") || temperamentText.toLowerCase().includes("дружній");
    });
  }
  
  // Get best match
  const matchedPet = filteredPets.length > 0 ? filteredPets[0] : null;
  
  if (!matchedPet) {
    return {
      pet: null,
      reason: "На жаль, ми не знайшли підходящого улюбленця за вашими критеріями. Спробуйте змінити бюджет або вимоги.",
      followUpQuestion: null,
      needsMoreInfo: false,
    };
  }
  
  // Generate reason
  let reason = "";
  if (wantsCat) {
    reason = `Ви шукали кота, і ${matchedPet.name} — чудовий вибір! `;
  } else if (wantsDog) {
    reason = `${matchedPet.name} — прекрасна собака, яка підійде вам. `;
  } else {
    reason = `На основі вашого опису, ${matchedPet.name} — найкращий варіант. `;
  }
  
  if (isApartment) {
    reason += `${matchedPet.type === "cat" ? "Коти" : "Ця собака"} чудово почуваються в квартирі. `;
  }
  
  if (hasChildren) {
    reason += `${matchedPet.name} дружній до дітей і стане чудовим другом для вашої родини. `;
  }
  
  if (budget) {
    reason += `Витрати (${matchedPet.monthly_cost ?? matchedPet.estimatedCost ?? 0} грн/міс) вкладаються у ваш бюджет. `;
  }
  
  return {
    pet: matchedPet,
    reason,
    followUpQuestion: null,
    needsMoreInfo: false,
  };
}