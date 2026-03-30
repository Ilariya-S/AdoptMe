import { useState, useEffect, FormEvent } from "react";
import { Pet } from "./types/pet";
import { apiCall } from "./utils/api";
import { PetCard } from "./components/PetCard";
import { AddPetForm } from "./components/AddPetForm";
import { Matchmaker } from "./components/Matchmaker";

interface LoginFormProps {
  onLogin: (email: string, password: string) => void;
  onSwitchToRegister: () => void;
}

function LoginForm({ onLogin, onSwitchToRegister }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onLogin(email.trim(), password.trim());
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm space-y-4">
        <h2 className="text-2xl font-bold">Вхід</h2>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-2 border border-stone-300 rounded"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
          className="w-full p-2 border border-stone-300 rounded"
        />
        <button type="submit" className="w-full py-2 bg-amber-600 text-white rounded">Увійти</button>
        <p className="text-sm text-stone-500">Немає аккаунта? <button type="button" onClick={onSwitchToRegister} className="text-amber-600 underline">Зареєструватися</button></p>
      </form>
    </div>
  );
}

interface RegisterFormProps {
  onRegister: (name: string, email: string, password: string) => void;
  onSwitchToLogin: () => void;
}

function RegisterForm({ onRegister, onSwitchToLogin }: RegisterFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onRegister(name.trim() || "Без імені", email.trim(), password.trim());
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm space-y-4">
        <h2 className="text-2xl font-bold">Реєстрація</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ім'я"
          className="w-full p-2 border border-stone-300 rounded"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-2 border border-stone-300 rounded"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
          className="w-full p-2 border border-stone-300 rounded"
        />
        <button type="submit" className="w-full py-2 bg-amber-600 text-white rounded">Зареєструватися</button>
        <p className="text-sm text-stone-500">Вже є акаунт? <button type="button" onClick={onSwitchToLogin} className="text-amber-600 underline">Увійти</button></p>
      </form>
    </div>
  );
}
import { Button } from "./components/ui/button";
import { LogOut } from "lucide-react";

interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  is_admin: boolean;
}

function App() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      name: "Maria Kolomiets",
      email: "maria.kolomiets.y@gmail.com",
      password: "mk160508",
      is_admin: true,
    },
  ]);
  
  // Стан для перемикання екранів: 'login', 'register', 'app'
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    apiCall('/pets').then(setPets).catch(console.error);
  }, []);

  // Спільний обробник успішної авторизації (вхід чи реєстрація)
  const handleAuthSuccess = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogin = (email: string, password: string) => {
    const userFound = users.find(u => u.email === email && u.password === password);
    if (!userFound) {
      alert('Невірний email або пароль');
      return;
    }
    handleAuthSuccess(userFound, 'fake-token');
  };

  const handleRegister = (name: string, email: string, password: string) => {
    if (users.some(u => u.email === email)) {
      alert('Користувач з таким email вже існує');
      return;
    }
    const nextId = Math.max(...users.map(u => u.id), 0) + 1;
    const newUser: User = {
      id: nextId,
      name,
      email,
      password,
      is_admin: false,
    };
    setUsers(prev => [...prev, newUser]);
    handleAuthSuccess(newUser, 'fake-token');
  };

  const handleLogout = () => {
    apiCall('/logout', 'POST', {}, localStorage.getItem('token') || undefined);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowAdminPanel(false);
  };

  const handleTrialDay = (pet: Pet) => {
    alert(`Тестовий день для ${pet.name} активовано!`);
  };

  const handleAdopt = (pet: Pet) => {
    alert(`Ви успішно забрали додому ${pet.name}!`);
  };

  // ... (решта логіки handleSavePet, handleDeletePet залишається без змін) ...

  const handleDeletePet = async (id: string) => {
    if (!confirm("Видалити цю тварину?")) return;
    try {
      await apiCall(`/pets/${id}`, 'DELETE', {}, localStorage.getItem('token') || undefined);
      setPets(pets.filter(p => p.id !== id));
    } catch (error) {
      alert("Помилка видалення");
    }
  };

  // Якщо користувач не залогінений - показуємо форми
  if (!user) {
    if (authView === 'register') {
      return (
        <RegisterForm
          onRegister={handleRegister}
          onSwitchToLogin={() => setAuthView('login')}
        />
      );
    }

    return (
      <LoginForm
        onLogin={handleLogin}
        onSwitchToRegister={() => setAuthView('register')}
      />
    );
  }

  // Основний додаток
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐾</span>
          <div>
            <h1 className="text-xl font-bold text-stone-800">AdoptMe Dnipro</h1>
            <p className="text-xs text-stone-500">
              {user.name} {user.is_admin && <span className="text-amber-600 font-bold">(Admin)</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user.is_admin && (
            <Button variant="outline" onClick={() => { 
              setEditingPet(null); 
              setShowAdminPanel(!showAdminPanel); 
            }}>
              {showAdminPanel ? "До каталогу" : "Панель адміна"}
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {showAdminPanel && user.is_admin ? (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">
              {editingPet ? "Редагування: " + editingPet.name : "Додати нову тварину"}
            </h2>
            <AddPetForm 
              initialData={editingPet || undefined} 
              onSubmit={(data) => {
                // Логіка збереження (скорочено для прикладу)
                alert("Функція збереження тут...");
              }} 
              onCancel={() => { setShowAdminPanel(false); setEditingPet(null); }} 
            />
          </div>
        ) : (
          <>
            <Matchmaker pets={pets} onMatch={handleAdopt} />
            <h2 className="text-2xl font-bold text-stone-800 mb-6 mt-12">Наші улюбленці</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {pets.map((pet) => (
                <PetCard 
                  key={pet.id} 
                  pet={pet} 
                  isAdmin={user.is_admin}
                  onTrialDay={handleTrialDay}
                  onAdopt={handleAdopt}
                  onEdit={(pet) => { setEditingPet(pet); setShowAdminPanel(true); }}
                  onDelete={handleDeletePet}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;