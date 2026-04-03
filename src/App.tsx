import { useState, useEffect, useCallback, useRef } from "react";
import { Pet, Application, AdoptionType, AdoptionFormData } from "./types/pet";
import { PetCard } from "./components/PetCard";
import { Matchmaker } from "./components/Matchmaker";
import { AdoptionForm } from "./components/AdoptionForm";
import { AddPetForm } from "./components/AddPetForm";
import { Button } from "./components/ui/button";
import { Plus, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { apiCall } from "./utils/api";
import { initialPets } from "./data/pets";


function AppContent() {
  const { user, token, loading, login, register, logout } = useAuth();
  const [pets, setPets] = useState<Pet[]>(initialPets);
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
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  //Donation
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [donateAmount, setDonateAmount] = useState<number>(100);
  const [isDonating, setIsDonating] = useState(false);

  //Filter
  const [aiFilteredPetIds, setAiFilteredPetIds] = useState<string[] | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 50;
  
  const petDetailAbortControllerRef = useRef<AbortController | null>(null);
  const currentPetIdRef = useRef<string | null>(null);

  const isAdmin = user?.isAdmin ?? false;

  const normalizePet = (raw: any): Pet => {
    const ageMonths = raw.age_months ?? (typeof raw.age === "string" ? Math.round(Number(raw.age.replace(/[^0-9.]/g, "")) * 12) : undefined);
    const temperamentTags = Array.isArray(raw.temperament_tags) ? raw.temperament_tags : raw.temperament ? String(raw.temperament).split(/,\s*/).filter(Boolean) : [];
    const rawId = raw.id ?? raw._id ?? null;
    let idValue = rawId != null ? String(rawId) : "";
    if (!idValue) {
      const fallbackIdParts = [raw.name, raw.breed_visual || raw.breed, raw.type, raw.sex, raw.age_months ?? raw.age].filter(Boolean).map((v: any) => String(v).trim().toLowerCase()).join("|");
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
    if (typeof ageMonths === "number" && !Number.isNaN(ageMonths)) normalizedPet.age_months = Math.round(ageMonths);
    if (typeof raw.weight_kg === "number") normalizedPet.weight_kg = raw.weight_kg;
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
      const data = await apiCall(`/pets?page=${currentPage}&per_page=${ITEMS_PER_PAGE}`, "GET", undefined, token || "");
      const serverPetsRaw: any[] = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : Array.isArray(data.pets) ? data.pets : [];
      let sourcePetsRaw = serverPetsRaw.length > 0 ? serverPetsRaw : initialPets;
      const activePetsRaw = sourcePetsRaw.filter(pet => !pet.deleted_at);
      const dedupedPetsMap = new Map<string, Pet>();
      for (const rawPet of activePetsRaw) {
        const pet = normalizePet(rawPet);
        if (!dedupedPetsMap.has(pet.id)) dedupedPetsMap.set(pet.id, pet);
      }
      const pagePets = Array.from(dedupedPetsMap.values());
      const totalCount = (data && !Array.isArray(data)) ? (data.total || data.total_items || data.meta?.total || pagePets.length) : pagePets.length;
      setPets(pagePets);
      setTotalPages(Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE)));
    } catch (error) {
      console.error("Error loading pets:", error);
      setPets(initialPets);
      setTotalPages(1);
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
      if (petDetailAbortControllerRef.current) petDetailAbortControllerRef.current.abort();
      const controller = new AbortController();
      petDetailAbortControllerRef.current = controller;
      currentPetIdRef.current = petId;
      setSelectedPetForDetails(null);
      setIsDetailsOpen(true);
      setDetailsLoading(true);
      let petDetail: any = null;
      try {
        const data = await apiCall(`/pets/${petId}`, "GET", undefined, token || "", controller.signal);
        petDetail = data?.data || data;
      } catch (backendError) {
        if ((backendError as any)?.name === "AbortError") return;
        petDetail = initialPets.find(p => p.id === petId);
      }
      if (currentPetIdRef.current === petId && petDetail) setSelectedPetForDetails(normalizePet(petDetail));
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

  useEffect(() => { loadPets(); }, [loadPets]);
  useEffect(() => {
    if (token && user) {
      if (isAdmin) loadAllApplications();
      else loadMyApplications();
    }
  }, [token, user, isAdmin, loadMyApplications, loadAllApplications]);

  const handleLogin = async () => {
    try {
      setAuthLoading(true); setAuthError("");
      await login(authEmail, authPassword);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Невірні облікові дані");
    } finally { setAuthLoading(false); }
  };

  const handleRegister = async () => {
    try {
      setAuthLoading(true); setAuthError("");
      if (!authEmail || !authPassword || !authName) { setAuthError("Заповніть всі поля"); return; }
      await register(authEmail, authPassword, authName);
      setIsRegisterMode(false);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Помилка реєстрації");
    } finally { setAuthLoading(false); }
  };

  const handleTrialDay = (pet: Pet) => {
    if (!user) { setAuthError("Будь ласка, увійдіть перед тим як забронювати"); return; }
    setSelectedPet(pet); setAdoptionType("trial");
  };

  const handleAdopt = (pet: Pet) => {
    if (!user) { setAuthError("Будь ласка, увійдіть перед тим як подати заявку"); return; }
    setSelectedPet(pet); setAdoptionType("adoption");
  };

  const handleFormSubmit = async (formData: AdoptionFormData) => {
    if (!selectedPet || !token) return;
    try {
      const payload = {
        pet_id: selectedPet.id,
        type: adoptionType === "trial" ? "trial_day" : "adoption",
        full_name: formData.fullName, phone: formData.phone, address: formData.address,
        has_children: formData.hasChildren, has_other_pets: formData.hasOtherPets,
        booking_date: formData.date, booking_time: formData.time, agreed_to_costs: formData.understandsCommitment,
      };
      await apiCall("/applications", "POST", payload, token);
      setSelectedPet(null); setShowToast(true); setTimeout(() => setShowToast(false), 3000);
      loadMyApplications();
    } catch (error) { alert("Помилка при подачі заявки"); }
  };

  const handleAddPet = async (pet: Pet) => {
    if (!token) return;
    try {
      const payload = { ...pet, age_months: pet.age_months || 0, temperament_tags: pet.temperament_tags || [] };
      await apiCall("/pets", "POST", payload, token);
      setShowAddPet(false); setShowToast(true); setTimeout(() => setShowToast(false), 3000);
      loadPets();
    } catch (error) { alert("Помилка при додаванні тварини"); }
  };

  const handleDeletePet = async (petId: string) => {
    if (!token || !confirm("Ви впевнені?")) return;
    try {
      await apiCall(`/pets/${petId}`, "DELETE", undefined, token);
      setShowToast(true); setTimeout(() => setShowToast(false), 3000);
      loadPets();
    } catch (error) { alert("Помилка при видаленні"); }
  };

  const handleUpdatePet = async (updated: Pet) => {
    if (!token) return;
    try {
      await apiCall(`/pets/${updated.id}`, "PUT", updated, token);
      setEditingPet(null); setShowToast(true); setTimeout(() => setShowToast(false), 3000);
      loadPets();
    } catch (error) { alert("Помилка при редагуванні"); }
  };

  const handleApproveApplication = async (appId: string) => {
    if (!token) return;
    try {
      await apiCall(`/applications/${appId}/approve`, "PATCH", {}, token);
      setShowToast(true); setTimeout(() => setShowToast(false), 3000);
      loadAllApplications();
    } catch (error) { alert("Помилка при схваленні"); }
  };

  const handleRejectApplication = async (appId: string) => {
    if (!token) return;
    try {
      await apiCall(`/applications/${appId}/reject`, "PATCH", {}, token);
      setShowToast(true); setTimeout(() => setShowToast(false), 3000);
      loadAllApplications();
    } catch (error) { alert("Помилка при відхиленні"); }
  };

  const handleDeleteApplication = async (appId: string) => {
    if (!token || !confirm("Ви впевнені?")) return;
    try {
      await apiCall(`/applications/${appId}`, "DELETE", undefined, token);
      setShowToast(true); setTimeout(() => setShowToast(false), 3000);
      loadMyApplications();
    } catch (error) { alert("Помилка при видаленні"); }
  };

  const handleReturnPetFromTrial = async (petId: string) => {
    if (!token || !confirm("Повернути тваринку?")) return;
    try {
      await apiCall(`/pets/${petId}/return`, "PATCH", {}, token);
      setShowToast(true); setTimeout(() => setShowToast(false), 3000);
      loadPets();
    } catch (error) { alert("Помилка при поверненні"); }
  };

  const handleDonate = async () => {
    try {
      setIsDonating(true);
      const response = await apiCall('/donate', 'POST', { amount: donateAmount });
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://www.liqpay.ua/api/3/checkout';
      const dataInput = document.createElement('input');
      dataInput.type = 'hidden'; dataInput.name = 'data'; dataInput.value = response.data;
      const signatureInput = document.createElement('input');
      signatureInput.type = 'hidden'; signatureInput.name = 'signature'; signatureInput.value = response.signature;
      form.appendChild(dataInput); form.appendChild(signatureInput);
      document.body.appendChild(form); form.submit();
    } catch (error) {
      alert("Помилка при створенні платежу.");
    } finally {
      setIsDonating(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Завантаження...</div>;

  return (
    <div className="min-h-screen bg-amber-50">
      <header className="bg-white border-b border-amber-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-amber-900">AdoptMe Dnipro</h1>
            <p className="text-xs text-slate-500">DniproAnimals Shelter {isAdmin && <span className="text-emerald-600 font-bold ml-2">Адмін-панель</span>}</p>
          </div>
          <div className="flex items-center gap-4">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowDonateModal(true)}>Задонатити 💛</Button>
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-700">{user.name}</span>
                <Button variant="outline" size="sm" onClick={logout} className="text-amber-800">Вийти</Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setIsRegisterMode(false)}>Увійти</Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!user && (
          <div className="mb-8 p-6 bg-white rounded-xl shadow-sm max-w-md mx-auto border border-amber-100">
            <h2 className="text-lg font-semibold text-amber-900 mb-4">{isRegisterMode ? "Реєстрація" : "Вхід"}</h2>
            <div className="space-y-4">
              {isRegisterMode && <input value={authName} onChange={(e) => setAuthName(e.target.value)} placeholder="Ім'я" className="w-full border border-amber-200 rounded-lg px-3 py-2" />}
              <input value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="Email" type="email" className="w-full border border-amber-200 rounded-lg px-3 py-2" />
              <input value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="Пароль" type="password" className="w-full border border-amber-200 rounded-lg px-3 py-2" />
              {authError && <p className="text-red-500 text-sm">{authError}</p>}
              <div className="flex gap-2">
                <Button onClick={isRegisterMode ? handleRegister : handleLogin} disabled={authLoading} className="flex-1 bg-amber-600">{authLoading ? "..." : isRegisterMode ? "Зареєструватися" : "Увійти"}</Button>
                <Button variant="outline" onClick={() => { setIsRegisterMode(!isRegisterMode); setAuthError(""); }} className="flex-1">{isRegisterMode ? "Маю акаунт" : "Реєстрація"}</Button>
              </div>
            </div>
          </div>
        )}

        {user && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              {!isAdmin ? (
                <>
                  <Matchmaker pets={pets} onMatch={handleAdopt} onAiFilter={(ids) => setAiFilteredPetIds(ids.length > 0 ? ids : null)} />
                  {applications.length > 0 && (
                    <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm">
                      <h3 className="text-lg font-semibold text-amber-900 mb-3">Мої заявки</h3>
                      <div className="space-y-3">
                        {applications.map(app => (
                          <div key={app.id} className="p-3 rounded-md border border-amber-100 bg-amber-50 flex justify-between items-start">
                            <div>
                              <p className="text-sm font-bold text-slate-700">{app.pet_name || "Тваринка"}</p>
                              <p className="text-[10px] text-slate-500">{app.booking_date} {app.booking_time}</p>
                              <p className="text-xs font-medium mt-1">Статус: <span className={app.status === "approved" ? "text-green-600" : app.status === "rejected" ? "text-red-600" : "text-yellow-600"}>{app.status}</span></p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteApplication(app.id)} className="text-red-400 p-0 h-6 w-6"><X className="w-4 h-4" /></Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-amber-900 mb-3">Заявки клієнтів</h3>
                    {allApplications.length > 0 ? (
                      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                        {allApplications.map(app => (
                          <div key={app.id} className="p-3 rounded-md border border-amber-100 bg-amber-50 text-xs shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-bold text-amber-900 text-sm">{app.pet_name || "Тваринка"}</p>
                                <p className="text-slate-600">Від: {app.user_name || app.full_name}</p>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${app.status === "approved" ? "bg-green-100 text-green-700" : app.status === "rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{app.status}</span>
                            </div>
                            <div className="flex gap-1 mb-2">
                              {app.status === "pending" && (
                                <>
                                  <Button size="sm" onClick={() => handleApproveApplication(app.id)} className="flex-1 bg-green-600 text-white h-7 text-[10px]">Прийняти</Button>
                                  <Button size="sm" variant="outline" onClick={() => handleRejectApplication(app.id)} className="flex-1 border-red-200 text-red-600 h-7 text-[10px]">Відхилити</Button>
                                </>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => setExpandedAppId(expandedAppId === app.id ? null : app.id)} className="px-2 h-7 text-amber-700 ml-auto">{expandedAppId === app.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</Button>
                            </div>
                            {expandedAppId === app.id && (
                              <div className="mt-2 pt-2 border-t border-amber-200 space-y-2 bg-white/50 p-2 rounded">
                                <p><strong>📞 Тел:</strong> {app.phone}</p>
                                <p><strong>🏠 Адреса:</strong> {app.address}</p>
                                <p><strong>📅 Коли:</strong> {app.booking_date} о {app.booking_time}</p>
                                <p><strong>👨‍👩‍👧‍👦 Діти:</strong> {app.has_children ? "Так" : "Ні"} | <strong>🐾 Тварини:</strong> {app.has_other_pets ? "Так" : "Ні"}</p>
                                <p><strong>📝 Тип:</strong> {app.type === "trial_day" ? "Тестовий день" : "Усиновлення"}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm text-slate-500">Заявок немає.</p>}
                  </div>
                  <Button onClick={() => setShowAddPet(!showAddPet)} className="w-full bg-amber-600 hover:bg-amber-700"><Plus className="w-4 h-4 mr-2" /> Додати тварину</Button>
                  {showAddPet && <AddPetForm onSubmit={handleAddPet} onCancel={() => setShowAddPet(false)} />}
                  <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-amber-900 mb-3">Тварини на тріалі</h3>
                    <div className="space-y-2">
                      {pets.filter(p => p.status === "trial").map(pet => (
                        <div key={pet.id} className="flex items-center justify-between p-2 border border-amber-100 rounded bg-amber-50">
                          <span className="text-sm font-medium">{pet.name}</span>
                          <Button size="sm" variant="outline" onClick={() => handleReturnPetFromTrial(pet.id)} className="text-xs">Повернути</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="lg:col-span-2">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-amber-900">Наші улюбленці</h2>
                <p className="text-slate-600">Знайдіть свого ідеального друга</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {(aiFilteredPetIds ? pets.filter(pet => aiFilteredPetIds.includes(pet.id)) : pets).map((pet) => (
                  <PetCard
                    key={pet.id} pet={pet}
                    onTrialDay={handleTrialDay} onAdopt={handleAdopt} onSelect={handleOpenPetDetails}
                    isAdmin={isAdmin} isBooked={applications.some(a => a.pet_id === pet.id)}
                    onDelete={handleDeletePet} onEdit={setEditingPet}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between mt-8">
                <Button variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                <span className="text-sm text-slate-600">Сторінка {currentPage} з {totalPages}</span>
                <Button variant="outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          </div>
        )}

        {isDetailsOpen && selectedPetForDetails && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl overflow-auto shadow-xl max-h-[90vh]">
              <div className="flex justify-between items-center p-4 border-b border-amber-100 sticky top-0 bg-white">
                <h3 className="text-xl font-bold text-amber-900">{detailsLoading ? "..." : selectedPetForDetails.name}</h3>
                <Button variant="ghost" onClick={() => { setIsDetailsOpen(false); setSelectedPetForDetails(null); }}>Закрити</Button>
              </div>
              <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
                <img src={selectedPetForDetails.photo_url || selectedPetForDetails.imageUrl} alt={selectedPetForDetails.name} className="w-full h-72 object-cover rounded-lg" />
                <div className="space-y-2">
                  <p><strong>Порода:</strong> {selectedPetForDetails.breed_visual || "Мікс"}</p>
                  <p><strong>Вік:</strong> {selectedPetForDetails.age_months} міс.</p>
                  <p><strong>Характер:</strong> {selectedPetForDetails.temperament_tags?.join(", ")}</p>
                  <p><strong>Стерилізація:</strong> {selectedPetForDetails.sterilized ? "Так" : "Ні"}</p>
                  <p><strong>Ціна утримання:</strong> {selectedPetForDetails.monthly_cost} грн/міс</p>
                  <p className="mt-4 text-slate-600">{selectedPetForDetails.description}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {editingPet && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]">
              <h3 className="text-xl font-semibold text-amber-900 mb-4">Редагування</h3>
              <div className="grid grid-cols-1 gap-3">
                <input className="border border-amber-200 rounded-lg px-3 py-2" value={editingPet.name} onChange={(e) => setEditingPet({ ...editingPet, name: e.target.value })} placeholder="Ім'я" />
                <input className="border border-amber-200 rounded-lg px-3 py-2" value={editingPet.photo_url || editingPet.imageUrl || ""} onChange={(e) => setEditingPet({ ...editingPet, photo_url: e.target.value })} placeholder="URL фото" />
                <textarea className="border border-amber-200 rounded-lg px-3 py-2" value={editingPet.description} onChange={(e) => setEditingPet({ ...editingPet, description: e.target.value })} placeholder="Опис" />
                <div className="flex gap-2">
                  <Button onClick={() => handleUpdatePet(editingPet)} className="flex-1 bg-emerald-600 text-white">Зберегти</Button>
                  <Button variant="outline" className="flex-1" onClick={() => setEditingPet(null)}>Скасувати</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {selectedPet && user && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-4 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-amber-900">{adoptionType === "trial" ? "Тріал" : "Усиновлення"}</h3><Button variant="ghost" onClick={() => setSelectedPet(null)}><X className="w-4 h-4" /></Button></div>
            <AdoptionForm pet={selectedPet} adoptionType={adoptionType} onSubmit={handleFormSubmit} onCancel={() => setSelectedPet(null)} />
          </div>
        </div>
      )}

      {showToast && <div className="fixed bottom-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right">Успішно!</div>}
      {showDonateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6">
            <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-amber-900">Донат</h3><Button variant="ghost" onClick={() => setShowDonateModal(false)}><X className="w-4 h-4" /></Button></div>
            <div className="space-y-4">
              <input type="number" value={donateAmount} onChange={(e) => setDonateAmount(Number(e.target.value))} className="w-full border border-amber-200 rounded-lg px-3 py-2" min="1" />
              <Button className="w-full bg-emerald-600 text-white" onClick={handleDonate} disabled={isDonating}>{isDonating ? "..." : "Сплатити"}</Button>
            </div>
          </div>
        </div>
      )}
      <footer className="bg-white border-t border-amber-100 mt-16 py-8 text-center text-slate-600 text-xs">© 2026 AdoptMe Dnipro — DniproAnimals Shelter.</footer>
    </div>
  );
}

function App() { return (<AuthProvider><AppContent /></AuthProvider>); }
export default App;
