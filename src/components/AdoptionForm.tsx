import { useState } from "react";
import { Pet, AdoptionFormData, AdoptionType } from "../types/pet";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

interface AdoptionFormProps {
  pet: Pet;
  adoptionType: AdoptionType;
  onSubmit: (formData: AdoptionFormData) => void;
  onCancel: () => void;
}

export function AdoptionForm({ pet, adoptionType, onSubmit, onCancel }: AdoptionFormProps) {
  const [formData, setFormData] = useState<AdoptionFormData>({
    fullName: "",
    phone: "",
    address: "",
    date: "",
    time: "",
    hasChildren: false,
    hasOtherPets: false,
    understandsCommitment: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Будь ласка, введіть ваше ім'я";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Будь ласка, введіть номер телефону";
    }
    if (!formData.address.trim()) {
      newErrors.address = "Будь ласка, введіть адресу";
    }
    if (!formData.date.trim()) {
      newErrors.date = "Будь ласка, оберіть дату";
    }
    if (!formData.time.trim()) {
      newErrors.time = "Будь ласка, оберіть час";
    }
    if (!formData.understandsCommitment) {
      newErrors.understandsCommitment = "Необхідно підтвердити розуміння зобов'язань";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const title = adoptionType === "trial" 
    ? `Тестовий день з ${pet.name}` 
    : `Забрати ${pet.name} додому`;

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-amber-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-amber-900">Повне ім'я *</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className={errors.fullName ? "border-red-400" : "border-amber-200"}
            />
            {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-amber-900">Телефон *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+380 XX XXX XX XX"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={errors.phone ? "border-red-400" : "border-amber-200"}
            />
            {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-amber-900">Адреса *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className={errors.address ? "border-red-400" : "border-amber-200"}
            />
            {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-amber-900">Чи є у вас діти?</Label>
            <RadioGroup
              value={formData.hasChildren ? "yes" : "no"}
              onValueChange={(value) => setFormData({ ...formData, hasChildren: value === "yes" })}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="yes" id="children-yes" />
                <Label htmlFor="children-yes" className="cursor-pointer">Так</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="no" id="children-no" />
                <Label htmlFor="children-no" className="cursor-pointer">Ні</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-amber-900">Дата бронювання *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className={errors.date ? "border-red-400" : "border-amber-200"}
              />
              {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="time" className="text-amber-900">Час бронювання *</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className={errors.time ? "border-red-400" : "border-amber-200"}
              />
              {errors.time && <p className="text-sm text-red-500">{errors.time}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-amber-900">Чи є у вас інші тварини?</Label>
            <RadioGroup
              value={formData.hasOtherPets ? "yes" : "no"}
              onValueChange={(value) => setFormData({ ...formData, hasOtherPets: value === "yes" })}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="yes" id="pets-yes" />
                <Label htmlFor="pets-yes" className="cursor-pointer">Так</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="no" id="pets-no" />
                <Label htmlFor="pets-no" className="cursor-pointer">Ні</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="commitment"
                checked={formData.understandsCommitment}
                onChange={(e) => setFormData({ ...formData, understandsCommitment: e.target.checked })}
                className="mt-1"
              />
              <Label htmlFor="commitment" className="cursor-pointer text-sm">
                Я розумію витрати ({pet.estimatedCost} грн/міс) та час на догляд ({pet.timeNeeded}) і готовий(а) взяти на себе відповідальність
              </Label>
            </div>
            {errors.understandsCommitment && <p className="text-sm text-red-500">{errors.understandsCommitment}</p>}
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
              {adoptionType === "trial" ? "Забронювати тестовий день" : "Надіслати заявку"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}