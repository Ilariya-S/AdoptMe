import { Pet } from "../types/pet";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../components/ui/card";

interface PetCardProps {
  pet: Pet;
  onTrialDay: (pet: Pet) => void;
  onAdopt: (pet: Pet) => void;
  isAdmin?: boolean;
  isBooked?: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (pet: Pet) => void;
}

export function PetCard({ pet, onTrialDay, onAdopt, isAdmin, isBooked = false, onDelete, onEdit }: PetCardProps) {
  return (
    <Card className="bg-white border-amber-100 hover:shadow-lg transition-shadow duration-300 overflow-hidden card-hover">
      <div className="relative h-48 bg-amber-50">
        <img
          src={pet.imageUrl}
          alt={pet.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=300&fit=crop";
          }}
        />
      </div>
      <CardHeader className="pb-3">
        <CardTitle className="text-amber-900 flex items-center justify-between">
          {pet.name}
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
            {pet.type === "cat" ? "Кіт" : "Собака"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pb-3">
        <p className="text-sm text-slate-600">
          <span className="font-medium text-amber-800">Порода:</span> {pet.breed}
        </p>
        <p className="text-sm text-slate-600">
          <span className="font-medium text-amber-800">Вік:</span> {pet.age}
        </p>
        <p className="text-sm text-slate-600">
          <span className="font-medium text-amber-800">Характер:</span> {pet.temperament}
        </p>
        <div className="pt-2 border-t border-amber-100">
          <p className="text-xs text-slate-500">
            💰 {pet.estimatedCost} грн/міс • ⏱️ {pet.timeNeeded}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 pt-0">
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 border-amber-300 text-amber-800 hover:bg-amber-50"
            onClick={() => onTrialDay(pet)}
            disabled={isBooked}
          >
            Тестовий день
          </Button>
          <Button
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            onClick={() => onAdopt(pet)}
            disabled={isBooked}
          >
            {isBooked ? "Заброньовано" : "Забрати додому"}
          </Button>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1 text-slate-700" onClick={() => onEdit?.(pet)}>
              Редагувати
            </Button>
            <Button variant="outline" className="flex-1 text-red-600 border-red-300" onClick={() => onDelete?.(pet.id)}>
              Видалити
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}