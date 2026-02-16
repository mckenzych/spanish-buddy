import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Volume2, RotateCcw, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getLanguageConfig } from "@/lib/languages";
import type { TargetLanguage } from "@/lib/languages";

interface SpeechRecognitionEvent { results: { [key: number]: { [key: number]: { transcript: string } } }; }
interface SpeechRecognitionErrorEvent { error: string; }
interface SpeechRecognitionInstance {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void; stop: () => void;
}

interface PhraseItem { text: string; english: string; difficulty: "easy" | "medium" | "hard"; tips: string[]; }

const phrasesByLanguage: Record<TargetLanguage, PhraseItem[]> = {
  spanish: [
    { text: "Hola, ¿cómo estás?", english: "Hello, how are you?", difficulty: "easy", tips: ["The 'h' is silent", "Stress on 'có' in 'cómo'"] },
    { text: "Mucho gusto", english: "Nice to meet you", difficulty: "easy", tips: ["'ch' sounds like English 'ch'", "The 'u' in 'gusto' is silent"] },
    { text: "Buenos días", english: "Good morning", difficulty: "easy", tips: ["Emphasize 'DÍ' syllable", "The 'ue' diphthong in 'buenos'"] },
    { text: "¿Dónde está el baño?", english: "Where is the bathroom?", difficulty: "medium", tips: ["Roll the 'r' slightly", "Stress on 'DÓN' and 'BA'"] },
    { text: "Me gustaría un café, por favor", english: "I would like a coffee, please", difficulty: "medium", tips: ["'gust-a-RÍ-a' has four syllables", "Soft 'd'"] },
    { text: "El perro corre rápido", english: "The dog runs fast", difficulty: "hard", tips: ["Strong rolled 'rr' in 'perro' and 'corre'", "Practice the trill!"] },
  ],
  french: [
    { text: "Bonjour, comment allez-vous ?", english: "Hello, how are you?", difficulty: "easy", tips: ["Nasal 'on' in 'bonjour'", "Silent final consonants"] },
    { text: "Enchanté", english: "Nice to meet you", difficulty: "easy", tips: ["Nasal 'en' sound", "Stress on the last syllable"] },
    { text: "Je voudrais un croissant", english: "I would like a croissant", difficulty: "medium", tips: ["The 'r' is uvular (back of throat)", "'oi' sounds like 'wa'"] },
    { text: "Où est la gare ?", english: "Where is the train station?", difficulty: "medium", tips: ["'ou' sounds like 'oo'", "Silent final 'e' in 'gare'"] },
    { text: "Il fait beau aujourd'hui", english: "The weather is nice today", difficulty: "medium", tips: ["'au' sounds like 'oh'", "Link 'fait' and 'beau'"] },
    { text: "Je ne comprends pas", english: "I don't understand", difficulty: "hard", tips: ["Nasal vowels: 'en' and 'an'", "The 'ne...pas' wraps around the verb"] },
  ],
  italian: [
    { text: "Ciao, come stai?", english: "Hello, how are you?", difficulty: "easy", tips: ["'ci' sounds like 'ch'", "All vowels are pure"] },
    { text: "Piacere di conoscerti", english: "Nice to meet you", difficulty: "easy", tips: ["'sc' before 'e' sounds like 'sh'", "Roll the 'r' lightly"] },
    { text: "Buongiorno", english: "Good morning", difficulty: "easy", tips: ["'gn' sounds like 'ny'", "Stress on 'GIOR'"] },
    { text: "Dov'è il bagno?", english: "Where is the bathroom?", difficulty: "medium", tips: ["'gn' sounds like 'ny' in 'bagno'", "Short contraction 'dov'è'"] },
    { text: "Vorrei un caffè, per favore", english: "I would like a coffee, please", difficulty: "medium", tips: ["Double 'f' in 'caffè' is longer", "Roll the 'r' in 'vorrei'"] },
    { text: "La ragazza corre velocemente", english: "The girl runs fast", difficulty: "hard", tips: ["Double 'z' in 'ragazza' sounds like 'ts'", "Roll the 'rr' in 'corre'"] },
  ],
  english: [
    { text: "How are you doing today?", english: "How are you doing today?", difficulty: "easy", tips: ["Stress on 'do' in 'doing'", "Natural intonation rises at end"] },
    { text: "Nice to meet you", english: "Nice to meet you", difficulty: "easy", tips: ["Link 'nice' and 'to'", "'meet' rhymes with 'feet'"] },
    { text: "Could you help me, please?", english: "Could you help me, please?", difficulty: "easy", tips: ["'Could' sounds like 'cud'", "Polite rising intonation"] },
    { text: "I'd like to make a reservation", english: "I'd like to make a reservation", difficulty: "medium", tips: ["Contract 'I would' to 'I'd'", "Stress on 'res-er-VA-tion'"] },
    { text: "The weather is beautiful", english: "The weather is beautiful", difficulty: "medium", tips: ["'th' is a dental fricative", "'beautiful' has 3 syllables: BYOO-tih-ful"] },
    { text: "She thoroughly thought through the theory", english: "She thoroughly thought through the theory", difficulty: "hard", tips: ["Multiple 'th' sounds", "Practice the difference between voiced and unvoiced 'th'"] },
  ],
};

export default function Pronunciation() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const { toast } = useToast();
  const { profile } = useAuth();

  const lang = getLanguageConfig(profile?.target_language || "spanish");
  const phrases = phrasesByLanguage[lang.id] || phrasesByLanguage.spanish;
  const currentPhrase = phrases[currentIndex % phrases.length];

  const playAudio = () => {
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentPhrase.text);
      utterance.lang = lang.speechLang;
      utterance.rate = 0.7;
      speechSynthesis.speak(utterance);
    }
  };

  const startRecording = () => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      toast({ title: "Not supported", description: "Speech recognition is not available. Try Chrome or Edge.", variant: "destructive" });
      return;
    }

    recognitionRef.current = new SpeechRecognitionAPI() as SpeechRecognitionInstance;
    recognitionRef.current.lang = lang.speechLang;
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onresult = (event) => {
      const result = event.results[0][0].transcript;
      setTranscript(result);
      evaluatePronunciation(result);
    };

    recognitionRef.current.onerror = (event) => {
      setIsRecording(false);
      if (event.error === "no-speech") {
        toast({ title: "No speech detected", description: "Please try speaking louder" });
      } else if (event.error === "not-allowed") {
        toast({ title: "Microphone access denied", description: "Please allow microphone access", variant: "destructive" });
      }
    };

    recognitionRef.current.onend = () => setIsRecording(false);
    recognitionRef.current.start();
    setIsRecording(true);
    setTranscript("");
    setScore(null);
    setFeedback([]);
  };

  const stopRecording = () => { recognitionRef.current?.stop(); setIsRecording(false); };

  const evaluatePronunciation = (spokenText: string) => {
    const target = currentPhrase.text.toLowerCase().replace(/[¿¡.,!?'"]/g, "");
    const spoken = spokenText.toLowerCase().replace(/[¿¡.,!?'"]/g, "");
    const targetWords = target.split(" ");
    const spokenWords = spoken.split(" ");
    let matchCount = 0;
    const feedbackItems: string[] = [];

    targetWords.forEach((word, i) => {
      if (spokenWords[i] && spokenWords[i] === word) { matchCount++; }
      else if (spokenWords[i]) { feedbackItems.push(`"${spokenWords[i]}" should be "${word}"`); }
      else { feedbackItems.push(`Missing word: "${word}"`); }
    });

    const similarityScore = Math.round((matchCount / targetWords.length) * 100);
    setScore(similarityScore);
    setFeedback(feedbackItems.slice(0, 3));
    setAttempts((prev) => prev + 1);

    if (similarityScore >= 80) toast({ title: `${lang.congratsMessage} 🎉`, description: "Great pronunciation!" });
    else if (similarityScore >= 50) toast({ title: "Good try! 👍", description: "Keep practicing." });
  };

  const nextPhrase = () => { setCurrentIndex((prev) => (prev + 1) % phrases.length); setTranscript(""); setScore(null); setFeedback([]); setAttempts(0); };
  const resetPhrase = () => { setTranscript(""); setScore(null); setFeedback([]); };

  const getDifficultyColor = (d: string) => {
    if (d === "easy") return "bg-success/20 text-success-foreground border-success/30";
    if (d === "medium") return "bg-warning/20 text-warning-foreground border-warning/30";
    return "bg-destructive/20 text-destructive-foreground border-destructive/30";
  };

  return (
    <div className="container py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">{lang.flag} Pronunciation Lab</h1>
        <p className="text-muted-foreground">Practice speaking {lang.label} with instant feedback</p>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <Progress value={((currentIndex + 1) / phrases.length) * 100} className="flex-1 h-2" />
        <Badge variant="secondary">{currentIndex + 1}/{phrases.length}</Badge>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Say this phrase:</CardTitle>
            <Badge className={getDifficultyColor(currentPhrase.difficulty)}>{currentPhrase.difficulty}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="font-display text-2xl md:text-3xl font-bold text-primary">{currentPhrase.text}</p>
            <p className="text-muted-foreground">{currentPhrase.english}</p>
            <Button variant="ghost" size="sm" onClick={playAudio} className="gap-2"><Volume2 className="h-4 w-4" />Listen</Button>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm font-medium mb-2">💡 Pronunciation tips:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {currentPhrase.tips.map((tip, i) => (<li key={i}>• {tip}</li>))}
            </ul>
          </div>

          <div className="flex justify-center">
            <Button size="lg" className={`h-20 w-20 rounded-full transition-all ${isRecording ? "bg-destructive hover:bg-destructive/90 animate-pulse" : "bg-primary hover:bg-primary/90"}`} onClick={isRecording ? stopRecording : startRecording}>
              {isRecording ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
            </Button>
          </div>
          <p className="text-center text-sm text-muted-foreground">{isRecording ? "Listening... Click to stop" : "Click to start recording"}</p>

          {transcript && (
            <div className="space-y-4 animate-slide-in-up">
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">You said:</p>
                <p className="font-medium text-lg">{transcript}</p>
              </div>
              {score !== null && (
                <div className="text-center space-y-3">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${score >= 80 ? "bg-success/20 text-success-foreground" : score >= 50 ? "bg-warning/20 text-warning-foreground" : "bg-destructive/20 text-destructive-foreground"}`}>
                    {score >= 80 ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    <span className="font-bold text-xl">{score}%</span><span>match</span>
                  </div>
                  {feedback.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium mb-1">Feedback:</p>
                      {feedback.map((item, i) => (<p key={i}>• {item}</p>))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button variant="outline" onClick={resetPhrase} className="flex-1 gap-2"><RotateCcw className="h-4 w-4" />Try Again</Button>
        <Button onClick={nextPhrase} className="flex-1 gap-2">Next Phrase<ChevronRight className="h-4 w-4" /></Button>
      </div>

      {attempts > 0 && <p className="text-center text-sm text-muted-foreground mt-4">Attempts on this phrase: {attempts}</p>}
    </div>
  );
}
