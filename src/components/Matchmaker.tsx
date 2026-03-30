import { useState } from "react";
import { Pet } from "../types/pet";
import { matchPet, MatchResult } from "../utils/aiMatcher";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Search, Loader2 } from "lucide-react";

interface MatchmakerProps {
  pets: Pet[];
  onMatch: (pet: Pet) => void;
}

export function Matchmaker({ pets, onMatch }: MatchmakerProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);

  const handleMatch = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const matchResult = matchPet(input, pets);
    setResult(matchResult);
    setLoading(false);
  };

  const handleFollowUp = async (answer: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const updatedInput = input + " " + answer;
    const matchResult = matchPet(updatedInput, pets);
    setResult(matchResult);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white border-amber-100">
        <CardHeader>
          <CardTitle className="text-amber-900 flex items-center gap-2">
            <Search className="w-5 h-5" />
            ШІ-Підбір улюбленця
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Живу у квартирі, працюю до 18:00, маю бюджет 1000 грн/міс, є діти..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-32 border-amber-200 resize-none"
          />
          <Button
            onClick={handleMatch}
            disabled={loading || !input.trim()}
            className="w-full bg-amber-600 hover:bg-amber-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Шукаємо ідеального улюбленця...
              </>
            ) : (
              "Підібрати улюбленця"
            )}
          </Button>
        </CardContent>
      </Card>

      {result?.needsMoreInfo && result.followUpQuestion && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-blue-900 mb-4">{result.followUpQuestion}</p>
            <div className="flex gap-2">
              <Button
                onClick={() => handleFollowUp("Так, є діти")}
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                Так
              </Button>
              <Button
                onClick={() => handleFollowUp("Ні, дітей немає")}
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                Ні
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {result?.pet && !result.needsMoreInfo && (
        <div className="animate-fade-in">
          <Card className="bg-emerald-50 border-emerald-200">
          <CardHeader>
            <CardTitle className="text-emerald-900">🎉 Знайдено ідеального улюбленця!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-emerald-800">{result.reason}</p>
            
            <div className="bg-white rounded-lg p-4 border border-emerald-100">
              <div className="flex items-start gap-4">
                <img
                  src={result.pet.imageUrl}
                  alt={result.pet.name}
                  className="w-24 h-24 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=300&fit=crop";
                  }}
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-emerald-900">{result.pet.name}</h3>
                  <p className="text-sm text-slate-600">{result.pet.breed}, {result.pet.age}</p>
                  <p className="text-sm text-slate-600 mt-1">{result.pet.temperament}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-emerald-100 space-y-2">
              <h4 className="font-medium text-emerald-900">💰 Щомісячні витрати</h4>
              <div className="text-sm space-y-1">
                <p className="text-slate-600">• Корм: {result.pet.costBreakdown.food} грн</p>
                <p className="text-slate-600">• Ветеринарія: {result.pet.costBreakdown.medical} грн</p>
                <p className="text-slate-600">• Інше: {result.pet.costBreakdown.other} грн</p>
                <p className="font-semibold text-emerald-700 pt-2">Всього: {result.pet.estimatedCost} грн/міс</p>
              </div>
              <div className="pt-2 border-t border-emerald-100">
                <p className="text-sm text-slate-600">
                  ⏱️ Час на догляд: <span className="font-medium text-emerald-700">{result.pet.timeNeeded}</span>
                </p>
              </div>
            </div>

            <Button
              onClick={() => onMatch(result.pet!)}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Забрати {result.pet.name} додому
            </Button>
          </CardContent>
        </Card>
        </div>
      )}

      {result && !result.pet && !result.needsMoreInfo && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <p className="text-amber-900">{result.reason}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}