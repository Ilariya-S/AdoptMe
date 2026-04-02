import { useState, useEffect, useCallback, useRef } from "react";
import { Pet, Application, AdoptionType, AdoptionFormData } from "./types/pet";
import { PetCard } from "./components/PetCard";
import { Matchmaker } from "./components/Matchmaker";
import { AdoptionForm } from "./components/AdoptionForm";
import { AddPetForm } from "./components/AddPetForm";
import { Button } from "./components/ui/button";
import { Plus, X, ChevronLeft, ChevronRight } from "lucide-react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { apiCall } from "./utils/api";
import { initialPets } from "./data/pets";


function AppContent() {
  const { user, token, loading, login, register, logout } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [selectedPetForDetails, setSelectedPetForDetails] = useState<Pet | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
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
  
  // Track current pet detail request to prevent race conditions
  const petDetailAbortControllerRef = useRef<AbortController | null>(null);
  const currentPetIdRef = useRef<string | null>(null);

  const isAdmin = user?.isAdmin ?? false;

  const normalizePet = (raw: any): Pet => {
    const ageMonths = raw.age_months ?? (typeof raw.age === "string" ? Math.round(Number(raw.age.replace(/[^0-9.]/g, "")) * 12) : undefined);
    const temperamentTags = Array.isArray(raw.temperament_tags)
      ? raw.temperament_tags
      : raw.temperament
      ? String(raw.temperament)
          .split(/,\s*/)
          .filter(Boolean)
      : [];

    const rawId = raw.id ?? raw._id ?? null;
    let idValue = rawId != null ? String(rawId) : "";
    if (!idValue) {
      const fallbackIdParts = [
        raw.name,
        raw.breed_visual || raw.breed,
        raw.type,
        raw.sex,
        raw.age_months ?? raw.age,
      ]
        .filter(Boolean)
        .map((v: any) => String(v).trim().toLowerCase())
        .join("|");
      idValue = fallbackIdParts ? `fallback-${fallbackIdParts}` : `fallback-${Math.random().toString(36).slice(2, 10)}`;
    }

    const normalizedPet: Pet = {
      id: idValue,
      type: raw.type === "cat" || raw.type === "dog" ? raw.type : "cat",
      breed_visual: raw.breed_visual || raw.breed || "",
      name: raw.name || "",
      sex: raw.sex || "",
      description: raw.description || "",
      size: raw.size || "",
      color: raw.color || "",
      sterilized: raw.sterilized ?? false,
      temperament_tags: temperamentTags,
      health_status: raw.health_status || "",
      medical_conditions: raw.medical_conditions || "",
      ideal_owner_tags: Array.isArray(raw.ideal_owner_tags) ? raw.ideal_owner_tags : [],
      photo_url: raw.photo_url || raw.imageUrl || "",
      monthly_cost: raw.monthly_cost ?? raw.estimatedCost ?? 0,
      status: raw.status || "available",
      age: raw.age,
      breed: raw.breed,
      temperament: raw.temperament,
      imageUrl: raw.imageUrl,
      estimatedCost: raw.estimatedCost,
      timeNeeded: raw.timeNeeded,
      costBreakdown: raw.costBreakdown,
    };

    if (typeof ageMonths === "number" && !Number.isNaN(ageMonths)) {
      normalizedPet.age_months = Math.round(ageMonths);
    }

    const weightKg = raw.weight_kg ?? raw.weightKg;
    if (typeof weightKg === "number") {
      normalizedPet.weight_kg = weightKg;
    }

    // Fallback for costBreakdown if not provided
    if (!normalizedPet.costBreakdown) {
      const initial = initialPets.find(p => p.name === normalizedPet.name && p.breed === normalizedPet.breed);
      if (initial?.costBreakdown) {
        normalizedPet.costBreakdown = initial.costBreakdown;
      }
    }

    return normalizedPet;
  };

  const normalizeApplication = (raw: any): Application => ({
    id: String(raw.id || raw._id || ""),
    user_id: String(raw.user_id || raw.userId || ""),
    pet_id: String(raw.pet_id || raw.petId || ""),
    type: raw.type || "trial_day",
    full_name: raw.full_name || raw.fullName || "",
    phone: raw.phone || "",
    address: raw.address || "",
    has_children: raw.has_children ?? raw.hasChildren ?? false,
    has_other_pets: raw.has_other_pets ?? raw.hasOtherPets ?? false,
    booking_date: raw.booking_date || raw.date || "",
    booking_time: raw.booking_time || raw.time || "",
    agreed_to_costs: raw.agreed_to_costs ?? raw.understandsCommitment ?? false,
    status: raw.status || raw.applicationStatus || "pending",
    created_at: raw.created_at || raw.createdAt || "",
    user_name: raw.user_name || raw.userName || "",
    pet_name: raw.pet_name || raw.petName || "",
  });

  const loadPets = useCallback(async () => {
    try {
      const data = await apiCall(`/pets?page=${currentPage}&limit=${ITEMS_PER_PAGE}`, "GET", undefined, token || "");

      const serverPetsRaw: any[] = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
        ? data.data
        : Array.isArray(data.pets)
        ? data.pets
        : [];

      // Only consider pagination metadata valid if we got data from server
      const hasPaginationMeta = serverPetsRaw.length > 0 && data && !Array.isArray(data) && (data.total || data.total_items || data.meta?.total);

      const sourcePetsRaw = serverPetsRaw.length > 0 ? serverPetsRaw : initialPets;
      const dedupedPetsMap = new Map<string, Pet>();
      for (const rawPet of sourcePetsRaw) {
        const pet = normalizePet(rawPet);
        const uniqueKey = pet.id || `${pet.name}|${pet.breed_visual}|${pet.type}|${pet.sex}|${pet.age_months ?? pet.age}`;
        if (!dedupedPetsMap.has(uniqueKey)) {
          dedupedPetsMap.set(uniqueKey, pet);
        }
      }
      const normalizedSourcePets = Array.from(dedupedPetsMap.values());

      // If backend provided pagination (API returned sliced results), use-as-is (deduped)
      // Otherwise, we need to slice the data ourselves for pagination
      const pagePets = hasPaginationMeta
        ? normalizedSourcePets
        : normalizedSourcePets.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

      const totalCount = hasPaginationMeta
        ? data.total || data.total_items || data.meta?.total || normalizedSourcePets.length
        : normalizedSourcePets.length;

      console.log(`Page ${currentPage}: loaded ${pagePets.length} pets, total pages: ${Math.ceil((totalCount || pagePets.length) / ITEMS_PER_PAGE)}`);
      
      setPets(pagePets);
      setTotalPages(Math.max(1, Math.ceil((totalCount || pagePets.length) / ITEMS_PER_PAGE)));
    } catch (error) {
      console.error("Error loading pets:", error);
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      setPets(initialPets.slice(start, end));
      setTotalPages(Math.max(1, Math.ceil(initialPets.length / ITEMS_PER_PAGE)));
    }
  }, [currentPage, token]);

  const loadMyApplications = useCallback(async () => {
    try {
      const data = await apiCall("/applications/my", "GET", undefined, token || "");
      const rawApplications = Array.isArray(data) ? data : data.applications || [];
      setApplications(rawApplications.map(normalizeApplication));
    } catch (error) {
      console.error("Error loading applications:", error);
    }
  }, [token]);

  const loadAllApplications = useCallback(async () => {
    try {
      const data = await apiCall("/applications", "GET", undefined, token || "");
      const rawApplications = Array.isArray(data) ? data : data.applications || [];
      setAllApplications(rawApplications.map(normalizeApplication));
    } catch (error) {
      console.error("Error loading all applications:", error);
    }
  }, [token]);

  const loadPetDetails = useCallback(async (petId: string) => {
    try {
      // Abort any previous pet detail request
      if (petDetailAbortControllerRef.current) {
        petDetailAbortControllerRef.current.abort();
      }

      const controller = new AbortController();
      petDetailAbortControllerRef.current = controller;

      // Track which pet we're loading
      currentPetIdRef.current = petId;

      // Reset details and show loading modal immediately
      setSelectedPetForDetails(null);
      setIsDetailsOpen(true);
      setDetailsLoading(true);

      let petDetail: any = null;
      try {
        const data = await apiCall(`/pets/${petId}`, "GET", undefined, token || "", controller.signal);
        petDetail = data?.data || data;
      } catch (backendError) {
        if ((backendError as any)?.name === "AbortError") {
          return;
        }
        console.warn("Backend pet detail failed, fallback to local pet data:", backendError);
        petDetail = initialPets.find((p) => p.id === petId) || null;
      }

      // Only update state if this is still the pet we're trying to load
      if (currentPetIdRef.current === petId && petDetail) {
        setSelectedPetForDetails(normalizePet(petDetail));
      } else if (currentPetIdRef.current === petId && !petDetail) {
        console.error("Pet details not found for id", petId);
      }
    } catch (error) {
      console.error("Error loading pet details:", error);
    } finally {
      setDetailsLoading(false);
    }
  }, [token]);

  const handleOpenPetDetails = (petId: string) => {
    const pet = pets.find(p => p.id === petId);
    if (pet) {
      setSelectedPetForDetails(pet);
      setIsDetailsOpen(true);
      loadPetDetails(petId);
    }
  };

  // Загружаем тварин при загрузке и при смене страницы
  useEffect(() => {
    loadPets();
  }, [loadPets]);

  // Abort in-flight pet detail fetch when component unmounts
  useEffect(() => {
    return () => {
      if (petDetailAbortControllerRef.current) {
        petDetailAbortControllerRef.current.abort();
      }
    };
  }, []);

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
        pet_id: selectedPet.id,
        type: adoptionType === "trial" ? "trial_day" : "adoption",
        full_name: formData.fullName,
        phone: formData.phone,
        address: formData.address,
        has_children: formData.hasChildren,
        has_other_pets: formData.hasOtherPets,
        booking_date: formData.date,
        booking_time: formData.time,
        agreed_to_costs: formData.understandsCommitment,
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
      const payload = {
        type: pet.type,
        breed_visual: pet.breed_visual || pet.breed || "",
        name: pet.name,
        sex: pet.sex || "",
        description: pet.description || "",
        age_months: pet.age_months || (pet.age ? Number(pet.age.toString().replace(/[^0-9.]/g, "")) * 12 : 0),
        size: pet.size || "",
        weight_kg: pet.weight_kg,
        color: pet.color || "",
        sterilized: pet.sterilized ?? false,
        temperament_tags: pet.temperament_tags || (pet.temperament ? pet.temperament.split(/,\s*/) : []),
        health_status: pet.health_status || "",
        medical_conditions: pet.medical_conditions || "",
        ideal_owner_tags: pet.ideal_owner_tags || [],
        photo_url: pet.photo_url || pet.imageUrl || "",
        monthly_cost: pet.monthly_cost ?? pet.estimatedCost ?? 0,
        status: pet.status || "available",
      };
      await apiCall("/pets", "POST", payload, token);
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
      const payload = {
        type: updated.type,
        breed_visual: updated.breed_visual || updated.breed || "",
        name: updated.name,
        sex: updated.sex || "",
        description: updated.description || "",
        age_months: updated.age_months || (updated.age ? Number(updated.age.toString().replace(/[^0-9.]/g, "")) * 12 : 0),
        size: updated.size || "",
        weight_kg: updated.weight_kg,
        color: updated.color || "",
        sterilized: updated.sterilized ?? false,
        temperament_tags: updated.temperament_tags || (updated.temperament ? updated.temperament.split(/,\s*/) : []),
        health_status: updated.health_status || "",
        medical_conditions: updated.medical_conditions || "",
        ideal_owner_tags: updated.ideal_owner_tags || [],
        photo_url: updated.photo_url || updated.imageUrl || "",
        monthly_cost: updated.monthly_cost ?? updated.estimatedCost ?? 0,
        status: updated.status || "available",
      };
      await apiCall(`/pets/${updated.id}`, "PUT", payload, token);
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
                            <p className="text-sm font-semibold text-slate-700">{app.pet_name || app.petName}</p>
                            <p className="text-xs text-slate-600">Дата: {app.booking_date || app.date} {app.booking_time || app.time}</p>
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
                            <p className="font-semibold">{app.pet_name || app.petName} - {app.user_name || app.userName}</p>
                            <p className="text-slate-600">{app.booking_date || app.date} {app.booking_time || app.time}</p>
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
                    onSelect={handleOpenPetDetails}
                    isAdmin={isAdmin}
                    isBooked={applications.some((a) => a.pet_id === pet.id)}
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

        {isDetailsOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl overflow-auto shadow-xl">
              <div className="flex justify-between items-center p-4 border-b border-amber-100">
                <h3 className="text-xl font-bold text-amber-900">
                  {detailsLoading ? "Завантаження тварини..." : selectedPetForDetails?.name || "Деталі тварини"}
                </h3>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsDetailsOpen(false);
                    setSelectedPetForDetails(null);
                  }}
                >
                  Закрити
                </Button>
              </div>
              {detailsLoading ? (
                <div className="p-8 text-center">Будь ласка зачекайте...</div>
              ) : selectedPetForDetails ? (
                <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <img
                    src={selectedPetForDetails.photo_url || selectedPetForDetails.imageUrl}
                    alt={selectedPetForDetails.name}
                    className="w-full h-72 object-cover rounded-lg"
                  />
                  <div className="space-y-2">
                    <p>
                      <strong>Порода:</strong> {selectedPetForDetails.breed_visual || selectedPetForDetails.breed || "-"}
                    </p>
                    <p>
                      <strong>Вік:</strong>{" "}
                      {selectedPetForDetails.age_months != null
                        ? `${selectedPetForDetails.age_months} міс.`
                        : selectedPetForDetails.age || "-"}
                    </p>
                    <p>
                      <strong>Тип:</strong> {selectedPetForDetails.type === "cat" ? "Кіт" : "Собака"}
                    </p>
                    {selectedPetForDetails.description && (
                      <p className="text-sm text-slate-600">
                        <strong>Опис:</strong> {selectedPetForDetails.description}
                      </p>
                    )}
                    <p>
                      <strong>Характер:</strong>{" "}
                      {Array.isArray(selectedPetForDetails.temperament_tags)
                        ? selectedPetForDetails.temperament_tags.join(", ")
                        : selectedPetForDetails.temperament || "-"}
                    </p>
                    <p>
                      <strong>Вартість:</strong>{" "}
                      {selectedPetForDetails.monthly_cost ?? selectedPetForDetails.estimatedCost ?? "-"} грн/міс
                    </p>
                    <p>
                      <strong>Потрібно часу:</strong>{" "}
                      {selectedPetForDetails.timeNeeded || "не вказано"}
                    </p>
                    <div className="bg-amber-50 p-3 rounded-lg">
                      <p className="font-semibold">Розбивка витрат:</p>
                      <p>Корм: {selectedPetForDetails.costBreakdown?.food ?? 0} грн</p>
                      <p>Медицина: {selectedPetForDetails.costBreakdown?.medical ?? 0} грн</p>
                      <p>Інше: {selectedPetForDetails.costBreakdown?.other ?? 0} грн</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center">Дані тварини не знайдено.</div>
              )}
              <div className="px-4 pb-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDetailsOpen(false);
                    setSelectedPetForDetails(null);
                  }}
                >
                  Закрити
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
