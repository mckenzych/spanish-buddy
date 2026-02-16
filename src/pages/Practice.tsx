import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RotateCcw, Check, X, Lightbulb, ChevronRight, ChevronLeft, Mic, Volume2, Shuffle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getLanguageConfig } from "@/lib/languages";

interface VocabItem {
  id: string;
  spanish: string;
  english: string;
  pronunciation_hint: string | null;
  tags: string[] | null;
}

type PracticeMode = "flashcards" | "multiple-choice" | "typing" | "speaking";

export default function Practice() {
  const [mode, setMode] = useState<PracticeMode>("flashcards");
  const [vocabulary, setVocabulary] = useState<VocabItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { profile } = useAuth();

  const lang = getLanguageConfig(profile?.target_language || "spanish");

  useEffect(() => {
    async function fetchVocabulary() {
      try {
        const { data, error } = await supabase.from("vocabulary_items").select("*").limit(50);
        if (error) throw error;
        const shuffled = (data || []).sort(() => Math.random() - 0.5);
        setVocabulary(shuffled);
      } catch (error) {
        console.error("Error fetching vocabulary:", error);
        toast({ title: "Error", description: "Failed to load vocabulary", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    fetchVocabulary();
  }, []);

  useEffect(() => {
    if (mode === "multiple-choice" && vocabulary.length > 0) generateChoices();
  }, [currentIndex, mode, vocabulary]);

  const generateChoices = () => {
    const current = vocabulary[currentIndex];
    if (!current) return;
    const wrongChoices = vocabulary.filter((v) => v.id !== current.id).sort(() => Math.random() - 0.5).slice(0, 3).map((v) => v.spanish);
    setChoices([...wrongChoices, current.spanish].sort(() => Math.random() - 0.5));
  };

  const currentWord = vocabulary[currentIndex];

  const nextWord = () => { setShowAnswer(false); setUserInput(""); setFeedback(null); setCurrentIndex((prev) => (prev + 1) % vocabulary.length); };
  const prevWord = () => { setShowAnswer(false); setUserInput(""); setFeedback(null); setCurrentIndex((prev) => (prev - 1 + vocabulary.length) % vocabulary.length); };

  const shuffleWords = () => {
    setVocabulary((prev) => [...prev].sort(() => Math.random() - 0.5));
    setCurrentIndex(0); setShowAnswer(false); setUserInput(""); setFeedback(null); setScore({ correct: 0, total: 0 });
  };

  const checkAnswer = (answer: string) => {
    const isCorrect = answer.toLowerCase().trim() === currentWord.spanish.toLowerCase().trim();
    setFeedback(isCorrect ? "correct" : "incorrect");
    setScore((prev) => ({ correct: prev.correct + (isCorrect ? 1 : 0), total: prev.total + 1 }));
    if (isCorrect) setTimeout(nextWord, 1000);
  };

  const playAudio = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang.speechLang;
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  if (loading) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading vocabulary...</p>
        </div>
      </div>
    );
  }

  if (vocabulary.length === 0) {
    return (
      <div className="container py-8">
        <Card className="text-center p-8">
          <CardTitle className="mb-4">No vocabulary found</CardTitle>
          <p className="text-muted-foreground">Start some lessons to unlock vocabulary practice!</p>
        </Card>
      </div>
    );
  }

  const progressPercent = ((currentIndex + 1) / vocabulary.length) * 100;

  return (
    <div className="container py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">{lang.flag} Practice Hub</h1>
        <p className="text-muted-foreground">Strengthen your {lang.label} vocabulary with different exercises</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="text-sm">{currentIndex + 1} / {vocabulary.length}</Badge>
          {score.total > 0 && <Badge className="bg-primary/10 text-primary">{Math.round((score.correct / score.total) * 100)}% correct</Badge>}
        </div>
        <Button variant="outline" size="sm" onClick={shuffleWords} className="gap-2"><Shuffle className="h-4 w-4" />Shuffle</Button>
      </div>

      <Progress value={progressPercent} className="mb-6 h-2" />

      <Tabs value={mode} onValueChange={(v) => setMode(v as PracticeMode)}>
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
          <TabsTrigger value="multiple-choice">Quiz</TabsTrigger>
          <TabsTrigger value="typing">Type</TabsTrigger>
          <TabsTrigger value="speaking">Speak</TabsTrigger>
        </TabsList>

        <TabsContent value="flashcards">
          <Card className={`cursor-pointer transition-all duration-300 min-h-[300px] ${showAnswer ? "bg-primary/5" : ""}`} onClick={() => setShowAnswer(!showAnswer)}>
            <CardContent className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
              {!showAnswer ? (
                <>
                  <p className="text-sm text-muted-foreground mb-2">Translate to {lang.label}:</p>
                  <p className="font-display text-3xl font-bold">{currentWord.english}</p>
                  <p className="mt-6 text-sm text-muted-foreground">Click to reveal</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-2">{lang.label}:</p>
                  <p className="font-display text-3xl font-bold text-primary">{currentWord.spanish}</p>
                  {currentWord.pronunciation_hint && <p className="mt-2 text-muted-foreground">[{currentWord.pronunciation_hint}]</p>}
                  <Button variant="ghost" size="sm" className="mt-4 gap-2" onClick={(e) => { e.stopPropagation(); playAudio(currentWord.spanish); }}>
                    <Volume2 className="h-4 w-4" />Listen
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="multiple-choice">
          <Card className="min-h-[300px]">
            <CardHeader><CardTitle className="text-center">What is "{currentWord.english}" in {lang.label}?</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {choices.map((choice, i) => (
                <Button key={i} variant={feedback ? (choice === currentWord.spanish ? "default" : "outline") : "outline"}
                  className={`w-full justify-start text-left h-auto py-4 ${feedback && choice === currentWord.spanish ? "bg-primary text-primary-foreground" : ""}`}
                  onClick={() => !feedback && checkAnswer(choice)} disabled={!!feedback}>
                  {choice}
                  {feedback && choice === currentWord.spanish && <Check className="ml-auto h-5 w-5" />}
                </Button>
              ))}
              {feedback === "incorrect" && (
                <div className="text-center mt-4"><p className="text-destructive mb-2">Try again!</p><Button onClick={nextWord}>Continue</Button></div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="typing">
          <Card className="min-h-[300px]">
            <CardHeader><CardTitle className="text-center">Type "{currentWord.english}" in {lang.label}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder="Type your answer..."
                className={`text-center text-lg ${feedback === "correct" ? "border-primary bg-primary/5" : feedback === "incorrect" ? "border-destructive bg-destructive/5" : ""}`}
                onKeyDown={(e) => { if (e.key === "Enter" && !feedback) checkAnswer(userInput); }} />
              {feedback === "correct" && <div className="text-center animate-scale-in"><Check className="h-12 w-12 text-primary mx-auto mb-2" /><p className="text-primary font-medium">{lang.congratsMessage}</p></div>}
              {feedback === "incorrect" && (
                <div className="text-center"><X className="h-12 w-12 text-destructive mx-auto mb-2" /><p className="text-destructive font-medium mb-2">Not quite...</p>
                  <p className="text-muted-foreground">Correct answer: <span className="font-medium text-primary">{currentWord.spanish}</span></p>
                  <Button onClick={nextWord} className="mt-4">Continue</Button></div>
              )}
              {!feedback && (
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-2" onClick={() => toast({ title: "Hint", description: currentWord.pronunciation_hint || "No hint available" })}><Lightbulb className="h-4 w-4" />Hint</Button>
                  <Button className="flex-1" onClick={() => checkAnswer(userInput)} disabled={!userInput.trim()}>Check</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="speaking">
          <Card className="min-h-[300px]">
            <CardHeader><CardTitle className="text-center">Say this in {lang.label}:</CardTitle></CardHeader>
            <CardContent className="text-center space-y-6">
              <div>
                <p className="font-display text-2xl font-bold mb-2">{currentWord.english}</p>
                <Button variant="ghost" size="sm" className="gap-2" onClick={() => playAudio(currentWord.spanish)}><Volume2 className="h-4 w-4" />Hear {lang.label}</Button>
              </div>
              <div className="py-4">
                <Button size="lg" className="h-16 w-16 rounded-full"><Mic className="h-6 w-6" /></Button>
                <p className="mt-2 text-sm text-muted-foreground">Tap to record (coming soon)</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Expected answer:</p>
                <p className="font-display text-xl text-primary">{currentWord.spanish}</p>
                {currentWord.pronunciation_hint && <p className="text-sm text-muted-foreground mt-1">[{currentWord.pronunciation_hint}]</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={prevWord} className="gap-2"><ChevronLeft className="h-4 w-4" />Previous</Button>
        <Button variant="outline" onClick={() => { setShowAnswer(false); setFeedback(null); }} className="gap-2"><RotateCcw className="h-4 w-4" />Reset</Button>
        <Button onClick={nextWord} className="gap-2">Next<ChevronRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
