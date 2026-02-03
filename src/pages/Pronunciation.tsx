import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  RotateCcw, 
  ChevronRight,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Speech Recognition types
interface SpeechRecognitionEvent {
  results: { [key: number]: { [key: number]: { transcript: string } } };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface PhraseItem {
  spanish: string;
  english: string;
  difficulty: "easy" | "medium" | "hard";
  tips: string[];
}

const phrases: PhraseItem[] = [
  {
    spanish: "Hola, ¿cómo estás?",
    english: "Hello, how are you?",
    difficulty: "easy",
    tips: ["The 'h' is silent", "Stress on 'có' in 'cómo'"],
  },
  {
    spanish: "Mucho gusto",
    english: "Nice to meet you",
    difficulty: "easy",
    tips: ["'ch' sounds like English 'ch'", "The 'u' in 'gusto' is silent"],
  },
  {
    spanish: "Buenos días",
    english: "Good morning",
    difficulty: "easy",
    tips: ["Emphasize 'DÍ' syllable", "The 'ue' diphthong in 'buenos'"],
  },
  {
    spanish: "¿Dónde está el baño?",
    english: "Where is the bathroom?",
    difficulty: "medium",
    tips: ["Roll the 'r' slightly", "Stress on 'DÓN' and 'BA'"],
  },
  {
    spanish: "Me gustaría un café, por favor",
    english: "I would like a coffee, please",
    difficulty: "medium",
    tips: ["'gust-a-RÍ-a' has four syllables", "Soft 'd' in 'gustaría'"],
  },
  {
    spanish: "El perro corre rápido",
    english: "The dog runs fast",
    difficulty: "hard",
    tips: ["Strong rolled 'rr' in 'perro' and 'corre'", "Practice the trill!"],
  },
];

export default function Pronunciation() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const { toast } = useToast();

  const currentPhrase = phrases[currentIndex];

  const playAudio = () => {
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentPhrase.spanish);
      utterance.lang = "es-ES";
      utterance.rate = 0.7;
      speechSynthesis.speak(utterance);
    } else {
      toast({
        title: "Not supported",
        description: "Text-to-speech is not available in your browser",
        variant: "destructive",
      });
    }
  };

  const startRecording = () => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      toast({
        title: "Not supported",
        description: "Speech recognition is not available in your browser. Try Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    recognitionRef.current = new SpeechRecognitionAPI() as SpeechRecognitionInstance;
    recognitionRef.current.lang = "es-ES";
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onresult = (event) => {
      const result = event.results[0][0].transcript;
      setTranscript(result);
      evaluatePronunciation(result);
    };

    recognitionRef.current.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
      if (event.error === "no-speech") {
        toast({
          title: "No speech detected",
          description: "Please try speaking louder and closer to your microphone",
        });
      } else if (event.error === "not-allowed") {
        toast({
          title: "Microphone access denied",
          description: "Please allow microphone access to use pronunciation practice",
          variant: "destructive",
        });
      }
    };

    recognitionRef.current.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current.start();
    setIsRecording(true);
    setTranscript("");
    setScore(null);
    setFeedback([]);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const evaluatePronunciation = (spokenText: string) => {
    const target = currentPhrase.spanish.toLowerCase().replace(/[¿¡.,!?]/g, "");
    const spoken = spokenText.toLowerCase().replace(/[¿¡.,!?]/g, "");
    
    // Simple word-by-word comparison
    const targetWords = target.split(" ");
    const spokenWords = spoken.split(" ");
    
    let matchCount = 0;
    const feedbackItems: string[] = [];

    targetWords.forEach((word, i) => {
      if (spokenWords[i] && spokenWords[i] === word) {
        matchCount++;
      } else if (spokenWords[i]) {
        feedbackItems.push(`"${spokenWords[i]}" should be "${word}"`);
      } else {
        feedbackItems.push(`Missing word: "${word}"`);
      }
    });

    const similarityScore = Math.round((matchCount / targetWords.length) * 100);
    setScore(similarityScore);
    setFeedback(feedbackItems.slice(0, 3)); // Show max 3 feedback items
    setAttempts((prev) => prev + 1);

    if (similarityScore >= 80) {
      toast({
        title: "¡Excelente! 🎉",
        description: "Great pronunciation!",
      });
    } else if (similarityScore >= 50) {
      toast({
        title: "¡Bien! 👍",
        description: "Good try! Keep practicing.",
      });
    }
  };

  const nextPhrase = () => {
    setCurrentIndex((prev) => (prev + 1) % phrases.length);
    setTranscript("");
    setScore(null);
    setFeedback([]);
    setAttempts(0);
  };

  const resetPhrase = () => {
    setTranscript("");
    setScore(null);
    setFeedback([]);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-success/20 text-success-foreground border-success/30";
      case "medium":
        return "bg-warning/20 text-warning-foreground border-warning/30";
      case "hard":
        return "bg-destructive/20 text-destructive-foreground border-destructive/30";
      default:
        return "";
    }
  };

  return (
    <div className="container py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">Pronunciation Lab</h1>
        <p className="text-muted-foreground">Practice speaking Spanish with instant feedback</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-4 mb-6">
        <Progress value={((currentIndex + 1) / phrases.length) * 100} className="flex-1 h-2" />
        <Badge variant="secondary">{currentIndex + 1}/{phrases.length}</Badge>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Say this phrase:</CardTitle>
            <Badge className={getDifficultyColor(currentPhrase.difficulty)}>
              {currentPhrase.difficulty}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Target phrase */}
          <div className="text-center space-y-2">
            <p className="font-display text-2xl md:text-3xl font-bold text-primary">
              {currentPhrase.spanish}
            </p>
            <p className="text-muted-foreground">{currentPhrase.english}</p>
            <Button variant="ghost" size="sm" onClick={playAudio} className="gap-2">
              <Volume2 className="h-4 w-4" />
              Listen
            </Button>
          </div>

          {/* Tips */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm font-medium mb-2">💡 Pronunciation tips:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {currentPhrase.tips.map((tip, i) => (
                <li key={i}>• {tip}</li>
              ))}
            </ul>
          </div>

          {/* Recording button */}
          <div className="flex justify-center">
            <Button
              size="lg"
              className={`h-20 w-20 rounded-full transition-all ${
                isRecording 
                  ? "bg-destructive hover:bg-destructive/90 animate-pulse" 
                  : "bg-primary hover:bg-primary/90"
              }`}
              onClick={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? (
                <MicOff className="h-8 w-8" />
              ) : (
                <Mic className="h-8 w-8" />
              )}
            </Button>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            {isRecording ? "Listening... Click to stop" : "Click to start recording"}
          </p>

          {/* Results */}
          {transcript && (
            <div className="space-y-4 animate-slide-in-up">
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">You said:</p>
                <p className="font-medium text-lg">{transcript}</p>
              </div>

              {score !== null && (
                <div className="text-center space-y-3">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                    score >= 80 
                      ? "bg-success/20 text-success-foreground" 
                      : score >= 50
                        ? "bg-warning/20 text-warning-foreground"
                        : "bg-destructive/20 text-destructive-foreground"
                  }`}>
                    {score >= 80 ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <AlertCircle className="h-5 w-5" />
                    )}
                    <span className="font-bold text-xl">{score}%</span>
                    <span>match</span>
                  </div>

                  {feedback.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium mb-1">Feedback:</p>
                      {feedback.map((item, i) => (
                        <p key={i}>• {item}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-4">
        <Button variant="outline" onClick={resetPhrase} className="flex-1 gap-2">
          <RotateCcw className="h-4 w-4" />
          Try Again
        </Button>
        <Button onClick={nextPhrase} className="flex-1 gap-2">
          Next Phrase
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {attempts > 0 && (
        <p className="text-center text-sm text-muted-foreground mt-4">
          Attempts on this phrase: {attempts}
        </p>
      )}
    </div>
  );
}
