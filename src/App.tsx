import { useState, useEffect, useCallback } from "react";
import { Pet, AdoptionType, AdoptionFormData } from "./types/pet";
import { PetCard } from "./components/PetCard";
import { Matchmaker } from "./components/Matchmaker";
import { AdoptionForm } from "./components/AdoptionForm";
import { AddPetForm } from "./components/AddPetForm";
import { Button } from "./components/ui/button";
import { Plus, X, ChevronLeft, ChevronRight } from "lucide-react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { apiCall } from "./utils/api";

interface Application {
  id: string;
  petId: string;
  petName: string;
  userId: string;
  userName: string;
  email: string;
  date: string;
  time: string;
  type: "trial_day" | "adoption";
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

function AppContent() {
  const { user, token, loading, login, register, logout } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [adoptionType, setAdoptionType] = useState<AdoptionType>("adoption");
  const [showAddPet, setShowAddPet] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [allApplications, setAllApplications] = useState<Application[]>([]);

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const isAdmin = user?.isAdmin ?? false;

  const loadPets = useCallback(async () => {
    try {
      const data = await apiCall(`/pets?page=${currentPage}&limit=${ITEMS_PER_PAGE}`, "GET");
      setPets(data.pets || []);
      setTotalPages(Math.ceil((data.total || 0) / ITEMS_PER_PAGE));
    } catch (error) {
      console.error("Error loading pets:", error);
    }
  }, [currentPage]);

  const loadMyApplications = useCallback(async () => {
    try {
      const data = await apiCall("/applications/my", "GET", undefined, token || "");
      setApplications(Array.isArray(data) ? data : data.applications || []);
    } catch (error) {
      console.error("Error loading applications:", error);
    }
  }, [token]);

  const loadAllApplications = useCallback(async () => {
    try {
      const data = await apiCall("/applications", "GET", undefined, token || "");
      setAllApplications(Array.isArray(data) ? data : data.applications || []);
    } catch (error) {
      console.error("Error loading all applications:", error);
    }
  }, [token]);

  // Загружаем тварин при загрузке и при смене страницы
  useEffect(() => {
    loadPets();
  }, [loadPets]);

  // Загружаем заявки если авторизован
  useEffect(() => {
    if (token && user) {
      loadMyApplications();
      if (isAdmin) {
        loadAllApplications();
      }
    }
  }, [token, user, isAdmin, loadMyApplications, loadAllApplications]);

  const resetAuth = () => {
    setAuthEmail("");
    setAuthPassword("");
    setAuthName("");
    setAuthError("");
  };

  const handleLogin = async () => {
    try {
      setAuthLoading(true);
      setAuthError("");
      await login(authEmail, authPassword);
      resetAuth();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Невірні облікові дані");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      setAuthLoading(true);
      setAuthError("");
      if (!authEmail || !authPassword || !authName) {
        setAuthError("Заповніть всі поля");
        setAuthLoading(false);
        return;
      }
      await register(authEmail, authPassword, authName);
      setIsRegisterMode(false);
      resetAuth();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Помилка реєстрації");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleTrialDay = (pet: Pet) => {
    if (!user) {
      setAuthError("Будь ласка, увійдіть перед тим як забронювати");
      return;
    }
    setSelectedPet(pet);
    setAdoptionType("trial");
  };

  const handleAdopt = (pet: Pet) => {
    if (!user) {
      setAuthError("Будь ласка, увійдіть перед тим як подати заявку");
      return;
    }
    setSelectedPet(pet);
    setAdoptionType("adoption");
  };

  const handleFormSubmit = async (formData: AdoptionFormData) => {
    if (!selectedPet || !token) return;

    try {
      const payload = {
        petId: selectedPet.id,
        type: adoptionType === "trial" ? "trial_day" : "adoption",
        date: formData.date,
        time: formData.time,
        phone: formData.phone,
        address: formData.address,
        hasChildren: formData.hasChildren,
        hasOtherPets: formData.hasOtherPets,
        understandsCommitment: formData.understandsCommitment,
      };
      
      await apiCall("/applications", "POST", payload, token);
      setSelectedPet(null);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      loadMyApplications();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Помилка при подачі заявки");
    }
  };

  const handleAddPet = async (pet: Pet) => {
    if (!token) return;
    try {
      await apiCall("/pets", "POST", pet, token);
      setShowAddPet(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      loadPets();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Помилка при додаванні тварини");
    }
  };

  const handleDeletePet = async (petId: string) => {
    if (!token) return;
    // eslint-disable-next-line no-restricted-globals
    if (!confirm("Ви впевнені?")) return;
    try {
      await apiCall(`/pets/${petId}`, "DELETE", undefined, token);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      loadPets();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Помилка при видаленні");
    }
  };

  const handleUpdatePet = async (updated: Pet) => {
    if (!token) return;
    try {
      await apiCall(`/pets/${updated.id}`, "PUT", updated, token);
      setEditingPet(null);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      loadPets();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Помилка при редагуванні");
    }
  };

  const handleApproveApplication = async (appId: string) => {
    if (!token) return;
    try {
      await apiCall(`/applications/${appId}/approve`, "PATCH", {}, token);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      loadAllApplications();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Помилка при схваленні");
    }
  };

  const handleRejectApplication = async (appId: string) => {
    if (!token) return;
    try {
      await apiCall(`/applications/${appId}/reject`, "PATCH", {}, token);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      loadAllApplications();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Помилка при відхиленні");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Завантаження...</div>;
  }

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
              {user ? (
                <>
                  <div className="text-sm text-slate-700">
                    {user.name} {isAdmin && "(Адмін)"}
                  </div>
                  <Button variant="outline" size="sm" onClick={logout} className="text-amber-800">
                    Вийти
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setIsRegisterMode(false)}>
                  Увійти
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!user && (
          <div className="mb-8 p-6 bg-white rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold text-amber-900 mb-4">
              {isRegisterMode ? "Реєстрація" : "Вхід"}
            </h2>
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
                <Button
                  onClick={isRegisterMode ? handleRegister : handleLogin}
                  disabled={authLoading}
                  className="flex-1 bg-amber-600"
                >
                  {authLoading ? "Завантаження..." : isRegisterMode ? "Зареєструватися" : "Увійти"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsRegisterMode(!isRegisterMode);
                    setAuthError("");
                  }}
                  className="flex-1"
                >
                  {isRegisterMode ? "Маю акаунт" : "Реєстрація"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {user && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              {!isAdmin ? (
                <>
                  <Matchmaker pets={pets} onMatch={handleAdopt} />
                  
                  {applications.length > 0 && (
                    <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm mt-6">
                      <h3 className="text-lg font-semibold text-amber-900 mb-3">Мої заявки</h3>
                      <div className="space-y-3 max-h-72 overflow-y-auto">
                        {applications.map((app) => (
                          <div key={app.id} className="p-3 rounded-md border border-amber-100 bg-amber-50">
                            <p className="text-sm font-semibold text-slate-700">{app.petName}</p>
                            <p className="text-xs text-slate-600">Дата: {app.date} {app.time}</p>
                            <p className="text-xs text-slate-600">
                              Статус: <span className={
                                app.status === "approved" ? "text-green-600 font-semibold" :
                                app.status === "rejected" ? "text-red-600 font-semibold" :
                                "text-yellow-600 font-semibold"
                              }>{
                                app.status === "pending" ? "Очікування" :
                                app.status === "approved" ? "Схвалено" :
                                "Відхилено"
                              }</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm mb-4">
                    <h3 className="text-lg font-semibold text-amber-900 mb-3">Заявки</h3>
                    {allApplications.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {allApplications.map((app) => (
                          <div key={app.id} className="p-2 rounded-md border border-amber-100 bg-amber-50 text-xs">
                            <p className="font-semibold">{app.petName} - {app.userName}</p>
                            <p className="text-slate-600">{app.date} {app.time}</p>
                            <p>Статус: {app.status}</p>
                            {app.status === "pending" && (
                              <div className="flex gap-1 mt-2">
                                <Button size="sm" onClick={() => handleApproveApplication(app.id)} className="flex-1 bg-green-600 text-xs">
                                  Схвалити
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleRejectApplication(app.id)} className="flex-1 text-red-600 text-xs">
                                  Відхилити
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">Немає заявок.</p>
                    )}
                  </div>

                  <Button
                    onClick={() => setShowAddPet(!showAddPet)}
                    className="w-full bg-amber-600 hover:bg-amber-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Додати тварину
                  </Button>

                  {showAddPet && (
                    <div className="mt-4">
                      <AddPetForm onSubmit={handleAddPet} onCancel={() => setShowAddPet(false)} />
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="lg:col-span-2">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-amber-900 mb-2">Наші улюбленці</h2>
                <p className="text-slate-600">Знайдіть свого ідеального друга</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {pets.map((pet) => (
                  <PetCard
                    key={pet.id}
                    pet={pet}
                    onTrialDay={handleTrialDay}
                    onAdopt={handleAdopt}
                    isAdmin={isAdmin}
                    isBooked={applications.some((a) => a.petId === pet.id)}
                    onDelete={handleDeletePet}
                    onEdit={handleUpdatePet}
                  />
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-8">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-slate-600">
                  Сторінка {currentPage} з {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
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

      {selectedPet && user && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-amber-100 flex items-center justify-between">
              <h3 className="font-semibold text-amber-900">
                {adoptionType === "trial" ? "Тестовий день" : "Заявка на усиновлення"}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPet(null)}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4">
              <AdoptionForm
                pet={selectedPet}
                adoptionType={adoptionType}
                onSubmit={handleFormSubmit}
                onCancel={() => setSelectedPet(null)}
              />
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
            <p className="text-slate-600">
              © 2024 AdoptMe Dnipro — DniproAnimals Shelter.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
