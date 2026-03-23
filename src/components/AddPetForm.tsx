import { useState } from "react";
import { Pet } from "../types/pet";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

interface AddPetFormProps {
  onSubmit: (pet: Pet) => void;
  onCancel: () => void;
  initialData?: Pet;
}

export function AddPetForm({ onSubmit, onCancel, initialData }: AddPetFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name ?? "",
    age: initialData?.age ?? "",
    breed: initialData?.breed ?? "",
    type: initialData?.type ?? "cat",
    temperament: initialData?.temperament ?? "",
    imageUrl: initialData?.imageUrl ?? "",
    estimatedCost: initialData ? String(initialData.estimatedCost) : "",
    timeNeeded: initialData?.timeNeeded ?? "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cost = parseInt(formData.estimatedCost);
    const newPet: Pet = {
      id: initialData?.id ?? Date.now().toString(),
      name: formData.name,
      age: formData.age,
      breed: formData.breed,
      type: formData.type,
      temperament: formData.temperament,
      imageUrl: formData.imageUrl || "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=300&fit=crop",
      estimatedCost: cost,
      timeNeeded: formData.timeNeeded,
      costBreakdown: {
        food: Math.round(cost * 0.6),
        medical: Math.round(cost * 0.25),
        other: Math.round(cost * 0.15),
      },
    };

    onSubmit(newPet);
  };

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-amber-900">Додати нову тварину</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-amber-900">Ім'я *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="border-amber-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age" className="text-amber-900">Вік *</Label>
              <Input
                id="age"
                placeholder="напр., 2 роки"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                required
                className="border-amber-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="breed" className="text-amber-900">Порода *</Label>
              <Input
                id="breed"
                value={formData.breed}
                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                required
                className="border-amber-200"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-amber-900">Тип *</Label>
              <RadioGroup
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as "cat" | "dog" })}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="cat" id="type-cat" />
                  <Label htmlFor="type-cat" className="cursor-pointer">Кіт</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="dog" id="type-dog" />
                  <Label htmlFor="type-dog" className="cursor-pointer">Собака</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="temperament" className="text-amber-900">Характер *</Label>
              <Input
                id="temperament"
                placeholder="напр., дружній, активний, любить дітей"
                value={formData.temperament}
                onChange={(e) => setFormData({ ...formData, temperament: e.target.value })}
                required
                className="border-amber-200"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="imageUrl" className="text-amber-900">URL зображення</Label>
              <Input
                id="imageUrl"
                placeholder="https://..."
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="border-amber-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost" className="text-amber-900">Витрати (грн/міс) *</Label>
              <Input
                id="cost"
                type="number"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                required
                className="border-amber-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="text-amber-900">Час на догляд *</Label>
              <Input
                id="time"
                placeholder="напр., 1 год/день"
                value={formData.timeNeeded}
                onChange={(e) => setFormData({ ...formData, timeNeeded: e.target.value })}
                required
                className="border-amber-200"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 border-amber-300 text-amber-800 hover:bg-amber-50"
            >
              Скасувати
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              Додати тварину
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}