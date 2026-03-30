import { useState } from "react";
import { Pet, AdoptionType, AdoptionFormData } from "./types/pet";
import { initialPets } from "./data/pets";
import { PetCard } from "./components/PetCard";
import { Matchmaker } from "./components/Matchmaker";
import { AdoptionForm } from "./components/AdoptionForm";
import { AddPetForm } from "./components/AddPetForm";
import { Button } from "./components/ui/button";
import { Plus, X } from "lucide-react";

interface UserAccount {
  email: string;
  password: string;
  name: string;
  isAdmin: boolean;
}

interface Booking {
  petId: string;
  petName: string;
  userName: string;
  date: string;
  time: string;
  adoptionType: "trial" | "adoption";
}

function App() {
  const [pets, setPets] = useState<Pet[]>(initialPets);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [adoptionType, setAdoptionType] = useState<AdoptionType>("adoption");
  const [showAddPet, setShowAddPet] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [users, setUsers] = useState<UserAccount[]>([
    { email: "maria.kolomiets.y@gmail.com", password: "mk160508", name: "Марія Коломієць", isAdmin: true },
    { email: "client@example.com", password: "Client123!", name: "Звичайний Клієнт", isAdmin: false },
  ]);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authError, setAuthError] = useState("");

  const isAdmin = currentUser?.isAdmin ?? false;

  const resetAuth = () => {
    setAuthEmail("");
    setAuthPassword("");
    setAuthName("");
    setAuthError("");
  };

  const login = () => {
    const user = users.find((u) => u.email.toLowerCase() === authEmail.toLowerCase() && u.password === authPassword);
    if (!user) {
      setAuthError("Невірний email або пароль");
      return;
    }
    setCurrentUser(user);
    resetAuth();
  };

  const register = () => {
    if (!authEmail || !authPassword || !authName) {
      setAuthError("Заповніть всі поля реєстрації");
      return;
    }
    if (users.some((u) => u.email.toLowerCase() === authEmail.toLowerCase())) {
      setAuthError("Користувач з таким email вже існує");
      return;
    }
    const newUser: UserAccount = { email: authEmail, password: authPassword, name: authName, isAdmin: false };
    setUsers([...users, newUser]);
    setCurrentUser(newUser);
    setIsRegisterMode(false);
    resetAuth();
  };

  const logout = () => {
    setCurrentUser(null);
    setShowAddPet(false);
    setEditingPet(null);
  };

  const handleTrialDay = (pet: Pet) => {
    setSelectedPet(pet);
    setAdoptionType("trial");
  };

  const handleAdopt = (pet: Pet) => {
    setSelectedPet(pet);
    setAdoptionType("adoption");
  };

  const handleFormSubmit = (formData: AdoptionFormData) => {
    if (!selectedPet) return;

    const isConflict = bookings.some(
      (b) =>
        b.petId === selectedPet.id &&
        b.date === formData.date &&
        b.time === formData.time
    );

    if (isConflict) {
      alert("Цей час вже заброньований. Виберіть інший.");
      return;
    }

    setBookings((prev) => [
      ...prev,
      {
        petId: selectedPet.id,
        petName: selectedPet.name,
        userName: formData.fullName,
        date: formData.date,
        time: formData.time,
        adoptionType,
      },
    ]);

    setSelectedPet(null);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleAddPet = (pet: Pet) => {
    setPets([...pets, pet]);
    setShowAddPet(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleDeletePet = (petId: string) => {
    setPets((current) => current.filter((p) => p.id !== petId));
  };

  const handleOpenEdit = (pet: Pet) => {
    setEditingPet(pet);
  };

  const handleUpdatePet = (updated: Pet) => {
    setPets((current) => current.map((p) => (p.id === updated.id ? updated : p)));
    setEditingPet(null);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="min-h-screen bg-amber-50">
      <header className="bg-white border-b border-amber-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-amber-900">AdoptMe Dnipro</h1>
              <p className="text-xs text-slate-500">DniproAnimals Shelter</p>
            </div>
            <div className="flex items-center gap-2">
              {currentUser ? (
                <>
                  <div className="text-sm text-slate-700">
                    {currentUser.name} ({currentUser.isAdmin ? "Admin" : "Client"})
                  </div>
                  <Button variant="outline" size="sm" onClick={logout} className="text-amber-800">
                    Вийти
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setIsRegisterMode(false)}>
                  Увійти / Зареєструватися
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!currentUser && (
          <div className="mb-8 p-6 bg-white rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold text-amber-900 mb-4">{isRegisterMode ? "Реєстрація" : "Вхід"}</h2>
            <div className="space-y-4">
              {isRegisterMode && (
                <input
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder="Ім'я"
                  className="w-full border border-amber-200 rounded-lg px-3 py-2"
                />
              )}
              <input
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="Email"
                type="email"
                className="w-full border border-amber-200 rounded-lg px-3 py-2"
              />
              <input
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="Пароль"
                type="password"
                className="w-full border border-amber-200 rounded-lg px-3 py-2"
              />
              {authError && <p className="text-red-500 text-sm">{authError}</p>}

              <div className="flex gap-2">
                <Button onClick={isRegisterMode ? register : login} className="flex-1 bg-amber-600">
                  {isRegisterMode ? "Зареєструватися" : "Увійти"}
                </Button>
                <Button variant="outline" onClick={() => { setIsRegisterMode(!isRegisterMode); setAuthError(""); }} className="flex-1">
                  {isRegisterMode ? "Маю акаунт" : "Реєстрація"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {currentUser && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              {!isAdmin ? (
                <Matchmaker pets={pets} onMatch={handleAdopt} />
              ) : (
                <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm mb-4">
                  <h3 className="text-lg font-semibold text-amber-900 mb-3">Заброньовані тварини</h3>
                  {bookings.length > 0 ? (
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {bookings.map((booking, idx) => (
                        <div key={`${booking.petId}-${idx}`} className="p-3 rounded-md border border-amber-100 bg-amber-50">
                          <p className="text-sm text-slate-700"><span className="font-semibold">Тварина:</span> {booking.petName}</p>
                          <p className="text-sm text-slate-700"><span className="font-semibold">Забронював:</span> {booking.userName}</p>
                          <p className="text-sm text-slate-700"><span className="font-semibold">Дата/час:</span> {booking.date} {booking.time}</p>
                          <p className="text-sm text-slate-700"><span className="font-semibold">Тип:</span> {booking.adoptionType === 'trial' ? 'Тестовий день' : 'Усиновлення'}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Поки немає бронювань.</p>
                  )}
                </div>
              )}

              {isAdmin && (
                <div className="mt-6">
                  <Button onClick={() => setShowAddPet(!showAddPet)} className="w-full bg-amber-600 hover:bg-amber-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Додати нову тварину
                  </Button>
                </div>
              )}

              {showAddPet && isAdmin && (
                <div className="mt-4">
                  <AddPetForm onSubmit={handleAddPet} onCancel={() => setShowAddPet(false)} />
                </div>
              )}
            </div>

            <div className="lg:col-span-2">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-amber-900 mb-2">Наші улюбленці</h2>
                <p className="text-slate-600">Знайдіть свого ідеального друга серед {pets.length} тварин</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {pets.map((pet) => (
                  <PetCard
                    key={pet.id}
                    pet={pet}
                    onTrialDay={handleTrialDay}
                    onAdopt={handleAdopt}
                    isAdmin={isAdmin}
                    isBooked={bookings.some((b) => b.petId === pet.id)}
                    onDelete={handleDeletePet}
                    onEdit={handleOpenEdit}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {isAdmin && bookings.length > 0 && (
          <div className="mt-8 bg-white p-4 rounded-xl border border-amber-200 shadow-sm">
            <h3 className="text-lg font-semibold text-amber-900 mb-3">Бронювання (адмін)</h3>
            <div className="grid gap-2">
              {bookings.map((booking, idx) => (
                <div key={`${booking.petId}-${idx}`} className="p-3 rounded-md border border-amber-100 bg-amber-50">
                  <p className="text-sm text-slate-700"><span className="font-semibold">Тварина:</span> {booking.petName}</p>
                  <p className="text-sm text-slate-700"><span className="font-semibold">Користувач:</span> {booking.userName}</p>
                  <p className="text-sm text-slate-700"><span className="font-semibold">Дата:</span> {booking.date} {booking.time}</p>
                  <p className="text-sm text-slate-700"><span className="font-semibold">Тип:</span> {booking.adoptionType === 'trial' ? 'Тестовий день' : 'Усиновлення'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {editingPet && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-lg p-6">
              <h3 className="text-xl font-semibold text-amber-900 mb-4">Редагування тварини</h3>
              <div className="grid grid-cols-1 gap-3">
                <input
                  className="border border-amber-200 rounded-lg px-3 py-2"
                  value={editingPet.name}
                  onChange={(e) => setEditingPet({ ...editingPet, name: e.target.value })}
                  placeholder="Ім'я"
                />
                <input
                  className="border border-amber-200 rounded-lg px-3 py-2"
                  value={editingPet.age}
                  onChange={(e) => setEditingPet({ ...editingPet, age: e.target.value })}
                  placeholder="Вік"
                />
                <input
                  className="border border-amber-200 rounded-lg px-3 py-2"
                  value={editingPet.breed}
                  onChange={(e) => setEditingPet({ ...editingPet, breed: e.target.value })}
                  placeholder="Порода"
                />
                <input
                  className="border border-amber-200 rounded-lg px-3 py-2"
                  value={editingPet.imageUrl}
                  onChange={(e) => setEditingPet({ ...editingPet, imageUrl: e.target.value })}
                  placeholder="URL зображення"
                />
                <input
                  type="number"
                  className="border border-amber-200 rounded-lg px-3 py-2"
                  value={editingPet.estimatedCost}
                  onChange={(e) => setEditingPet({ ...editingPet, estimatedCost: Number(e.target.value) })}
                  placeholder="Вартість"
                />
                <div className="flex gap-2">
                  <Button onClick={() => editingPet && handleUpdatePet(editingPet)} className="flex-1 bg-emerald-600">
                    Зберегти
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setEditingPet(null)}>
                    Скасувати
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {selectedPet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="p-4 border-b border-amber-100 flex items-center justify-between">
              <h3 className="font-semibold text-amber-900">
                {adoptionType === "trial" ? "Тестовий день" : "Заявка на усиновлення"}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedPet(null)} className="text-slate-500 hover:text-slate-700">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4">
              <AdoptionForm pet={selectedPet} adoptionType={adoptionType} onSubmit={handleFormSubmit} onCancel={() => setSelectedPet(null)} />
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div className="fixed bottom-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right">
          <p className="font-medium">Операція завершена успішно!</p>
        </div>
      )}

      <footer className="bg-white border-t border-amber-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-slate-600">© 2024 AdoptMe Dnipro — DniproAnimals Shelter. Всі тварини чекають на дім.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;