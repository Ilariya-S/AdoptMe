import { useState } from "react";
import { Pet } from "../types/pet";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

interface AddPetFormProps {
  onSubmit: (pet: any) => void; // Тепер передаємо any, щоб App.tsx сам розібрався
  onCancel: () => void;
}

export function AddPetForm({ onSubmit, onCancel }: AddPetFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "cat" as "cat" | "dog",
    breed_visual: "",
    sex: "Невідомо",
    age_months: "",
    size: "Середній",
    weight_kg: "",
    color: "",
    sterilized: false,
    monthly_cost: "",
    health_status: "",
    medical_conditions: "",
    temperament_tags: "", // Строка, щоб користувачу було зручно вводити через кому
    ideal_owner_tags: "", // Строка
    photo_url: "",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Форматуємо дані перед відправкою (переводимо строки в масиви та числа)
    const formattedData = {
      ...formData,
      age_months: parseInt(formData.age_months) || 0,
      weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
      monthly_cost: parseInt(formData.monthly_cost) || 0,
      temperament_tags: formData.temperament_tags.split(',').map(t => t.trim()).filter(Boolean),
      ideal_owner_tags: formData.ideal_owner_tags.split(',').map(t => t.trim()).filter(Boolean),
      status: "available"
    };

    onSubmit(formattedData);
  };

  return (
    <Card className="bg-white border-0 shadow-none">
      <CardHeader className="sticky top-0 bg-white z-10 border-b border-amber-100 pb-4">
        <CardTitle className="text-amber-900 text-xl">Додати нову тварину</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Базова інформація */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-amber-900">Ім'я *</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="border-amber-200" />
            </div>

            <div className="space-y-2">
              <Label className="text-amber-900">Тип *</Label>
              <RadioGroup value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as "cat" | "dog" })} className="flex gap-4 pt-2">
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

            <div className="space-y-2">
              <Label htmlFor="breed_visual" className="text-amber-900">Порода</Label>
              <Input id="breed_visual" placeholder="Напр. метис лайки" value={formData.breed_visual} onChange={(e) => setFormData({ ...formData, breed_visual: e.target.value })} className="border-amber-200" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sex" className="text-amber-900">Стать *</Label>
              <select id="sex" className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-600" value={formData.sex} onChange={(e) => setFormData({ ...formData, sex: e.target.value })}>
                <option value="Хлопчик">Хлопчик</option>
                <option value="Дівчинка">Дівчинка</option>
                <option value="Невідомо">Невідомо</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="age_months" className="text-amber-900">Вік (у місяцях) *</Label>
              <Input id="age_months" type="number" min="0" placeholder="Напр. 18" value={formData.age_months} onChange={(e) => setFormData({ ...formData, age_months: e.target.value })} required className="border-amber-200" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly_cost" className="text-amber-900">Щомісячні витрати (грн) *</Label>
              <Input id="monthly_cost" type="number" min="0" value={formData.monthly_cost} onChange={(e) => setFormData({ ...formData, monthly_cost: e.target.value })} required className="border-amber-200" />
            </div>

            {/* Фізичні характеристики */}
            <div className="space-y-2">
              <Label htmlFor="size" className="text-amber-900">Розмір *</Label>
              <select id="size" className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-600" value={formData.size} onChange={(e) => setFormData({ ...formData, size: e.target.value })}>
                <option value="Малий">Малий</option>
                <option value="Середній">Середній</option>
                <option value="Великий">Великий</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight_kg" className="text-amber-900">Вага (кг)</Label>
              <Input id="weight_kg" type="number" step="0.1" placeholder="Напр. 12.5" value={formData.weight_kg} onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })} className="border-amber-200" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color" className="text-amber-900">Окрас</Label>
              <Input id="color" placeholder="Напр. сіро-білий" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="border-amber-200" />
            </div>

            <div className="space-y-2 flex items-center pt-6">
              <label className="flex items-center cursor-pointer text-sm font-medium text-amber-900">
                <input type="checkbox" className="mr-2 w-4 h-4 accent-amber-600" checked={formData.sterilized} onChange={(e) => setFormData({ ...formData, sterilized: e.target.checked })} />
                Тварина стерилізована
              </label>
            </div>

            {/* Здоров'я та теги */}
            <div className="space-y-2">
              <Label htmlFor="health_status" className="text-amber-900">Стан здоров'я</Label>
              <Input id="health_status" placeholder="Напр. Здоровий, щеплений" value={formData.health_status} onChange={(e) => setFormData({ ...formData, health_status: e.target.value })} className="border-amber-200" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="medical_conditions" className="text-amber-900">Медичні показання (якщо є)</Label>
              <Input id="medical_conditions" placeholder="Специфічні хвороби або дієта" value={formData.medical_conditions} onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })} className="border-amber-200" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperament_tags" className="text-amber-900">Риси характеру (через кому)</Label>
              <Input id="temperament_tags" placeholder="грайливий, активний, незалежний" value={formData.temperament_tags} onChange={(e) => setFormData({ ...formData, temperament_tags: e.target.value })} className="border-amber-200" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ideal_owner_tags" className="text-amber-900">Ідеальний власник (через кому)</Label>
              <Input id="ideal_owner_tags" placeholder="без котів, для активних" value={formData.ideal_owner_tags} onChange={(e) => setFormData({ ...formData, ideal_owner_tags: e.target.value })} className="border-amber-200" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="photo_url" className="text-amber-900">URL фотографії *</Label>
              <Input id="photo_url" placeholder="https://..." value={formData.photo_url} onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })} required className="border-amber-200" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description" className="text-amber-900">Детальний опис *</Label>
              <Textarea id="description" rows={4} placeholder="Розкажіть історію тваринки та деталі..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required className="border-amber-200 resize-none" />
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-amber-100 mt-6 sticky bottom-0 bg-white py-4">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1 border-amber-300 text-amber-800 hover:bg-amber-50">
              Скасувати
            </Button>
            <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
              Зберегти в базу
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}