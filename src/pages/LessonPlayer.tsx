import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronRight, 
  Check, 
  X, 
  Volume2, 
  Lightbulb,
  ArrowLeft,
  Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Exercise {
  type: "translate" | "fill_blank" | "multiple_choice" | "listening";
  prompt: string;
  answer: string;
  choices?: string[];
  hint?: string;
  audioText?: string;
}

interface LessonData {
  id: string;
  title: string;
  xp_reward: number;
  exercises: Exercise[];
}

// Sample exercises - in production, these would come from AI generation
const sampleExercises: Exercise[] = [
  {
    type: "translate",
    prompt: 'Translate to Spanish: "Hello, how are you?"',
    answer: "Hola, ¿cómo estás?",
    hint: "Remember: 'cómo' has an accent",
  },
  {
    type: "multiple_choice",
    prompt: 'What does "buenos días" mean?',
    choices: ["Good night", "Good morning", "Good afternoon", "Goodbye"],
    answer: "Good morning",
  },
  {
    type: "fill_blank",
    prompt: "Me ___ Juan. (My name is Juan)",
    choices: ["soy", "llamo", "tengo", "estoy"],
    answer: "llamo",
  },
  {
    type: "translate",
    prompt: 'Translate to Spanish: "Nice to meet you"',
    answer: "Mucho gusto",
    hint: "Literally means 'much pleasure'",
  },
  {
    type: "listening",
    prompt: "Listen and type what you hear:",
    answer: "gracias",
    audioText: "gracias",
  },
];

export default function LessonPlayer() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { user, updateProfile, profile } = useAuth();
  const { toast } = useToast();

  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLesson() {
      if (!lessonId) return;

      try {
        const { data, error } = await supabase
          .from("lessons")
          .select("*")
          .eq("id", lessonId)
          .single();

        if (error) throw error;

        setLesson({
          ...data,
          exercises: sampleExercises, // In production: generate from AI
        });
      } catch (error) {
        console.error("Error fetching lesson:", error);
        toast({
          title: "Error",
          description: "Failed to load lesson",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchLesson();
  }, [lessonId]);

  const exercise = lesson?.exercises[currentExercise];
  const progress = lesson ? ((currentExercise + 1) / lesson.exercises.length) * 100 : 0;

  const playAudio = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "es-ES";
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const checkAnswer = () => {
    if (!exercise) return;

    const answer = exercise.type === "multiple_choice" || exercise.type === "fill_blank"
      ? selectedChoice
      : userAnswer;

    const correct = answer?.toLowerCase().trim() === exercise.answer.toLowerCase().trim();
    
    setFeedback(correct ? "correct" : "incorrect");
    setScore((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const nextExercise = async () => {
    if (!lesson) return;

    if (currentExercise < lesson.exercises.length - 1) {
      setCurrentExercise((prev) => prev + 1);
      setUserAnswer("");
      setSelectedChoice(null);
      setFeedback(null);
      setShowHint(false);
    } else {
      // Lesson complete
      setCompleted(true);
      
      // Save progress if logged in
      if (user) {
        try {
          await supabase.from("lesson_attempts").insert({
            user_id: user.id,
            lesson_id: lessonId,
            score: Math.round((score.correct / score.total) * 100),
            completed: true,
            xp_earned: lesson.xp_reward,
            attempt_data: { answers: score },
          });

          // Update XP
          await updateProfile({
            xp_points: (profile?.xp_points || 0) + lesson.xp_reward,
          });

          toast({
            title: "¡Felicidades! 🎉",
            description: `You earned ${lesson.xp_reward} XP!`,
          });
        } catch (error) {
          console.error("Error saving progress:", error);
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="container py-8">
        <Card className="text-center p-8">
          <p>Lesson not found</p>
          <Button onClick={() => navigate("/learn")} className="mt-4">
            Back to Learn Path
          </Button>
        </Card>
      </div>
    );
  }

  if (completed) {
    const accuracy = Math.round((score.correct / score.total) * 100);
    
    return (
      <div className="container py-8 max-w-xl">
        <Card className="text-center p-8 animate-scale-in">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="font-display text-3xl font-bold mb-2">¡Excelente!</h1>
          <p className="text-muted-foreground mb-6">You completed the lesson!</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-primary/10 rounded-lg">
              <p className="text-3xl font-bold text-primary">{accuracy}%</p>
              <p className="text-sm text-muted-foreground">Accuracy</p>
            </div>
            <div className="p-4 bg-xp/10 rounded-lg">
              <p className="text-3xl font-bold text-xp">+{lesson.xp_reward}</p>
              <p className="text-sm text-muted-foreground">XP Earned</p>
            </div>
          </div>

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate("/learn")} className="flex-1">
              Back to Path
            </Button>
            <Button onClick={() => window.location.reload()} className="flex-1">
              Practice Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/learn")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Exit
        </Button>
        <Badge variant="secondary" className="gap-1">
          <Zap className="h-3 w-3" />
          +{lesson.xp_reward} XP
        </Badge>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">{lesson.title}</span>
          <span className="font-medium">{currentExercise + 1}/{lesson.exercises.length}</span>
        </div>
        <Progress value={progress} className="h-3" />
      </div>

      {/* Exercise Card */}
      {exercise && (
        <Card className="mb-6">
          <CardContent className="p-6 space-y-6">
            {/* Exercise prompt */}
            <div>
              <p className="text-lg font-medium mb-2">{exercise.prompt}</p>
              
              {exercise.type === "listening" && exercise.audioText && (
                <Button
                  variant="outline"
                  onClick={() => playAudio(exercise.audioText!)}
                  className="gap-2"
                >
                  <Volume2 className="h-4 w-4" />
                  Play Audio
                </Button>
              )}
            </div>

            {/* Answer input based on type */}
            {(exercise.type === "translate" || exercise.type === "listening") && (
              <Input
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your answer..."
                className={`text-lg ${
                  feedback === "correct" 
                    ? "border-primary bg-primary/5" 
                    : feedback === "incorrect"
                      ? "border-destructive bg-destructive/5"
                      : ""
                }`}
                disabled={!!feedback}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !feedback) checkAnswer();
                }}
              />
            )}

            {(exercise.type === "multiple_choice" || exercise.type === "fill_blank") && (
              <div className="grid gap-3">
                {exercise.choices?.map((choice, i) => (
                  <Button
                    key={i}
                    variant={
                      feedback
                        ? choice === exercise.answer
                          ? "default"
                          : selectedChoice === choice
                            ? "destructive"
                            : "outline"
                        : selectedChoice === choice
                          ? "secondary"
                          : "outline"
                    }
                    className={`justify-start text-left h-auto py-3 ${
                      feedback && choice === exercise.answer 
                        ? "bg-primary text-primary-foreground" 
                        : ""
                    }`}
                    onClick={() => !feedback && setSelectedChoice(choice)}
                    disabled={!!feedback}
                  >
                    {choice}
                    {feedback && choice === exercise.answer && (
                      <Check className="ml-auto h-5 w-5" />
                    )}
                  </Button>
                ))}
              </div>
            )}

            {/* Feedback */}
            {feedback && (
              <div className={`p-4 rounded-lg animate-scale-in ${
                feedback === "correct" 
                  ? "bg-primary/10 border border-primary/20" 
                  : "bg-destructive/10 border border-destructive/20"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {feedback === "correct" ? (
                    <>
                      <Check className="h-5 w-5 text-primary" />
                      <span className="font-medium text-primary">¡Correcto!</span>
                    </>
                  ) : (
                    <>
                      <X className="h-5 w-5 text-destructive" />
                      <span className="font-medium text-destructive">Not quite...</span>
                    </>
                  )}
                </div>
                {feedback === "incorrect" && (
                  <p className="text-sm">
                    Correct answer: <span className="font-medium">{exercise.answer}</span>
                  </p>
                )}
              </div>
            )}

            {/* Hint */}
            {exercise.hint && !feedback && (
              <div>
                {showHint ? (
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    💡 {exercise.hint}
                  </p>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHint(true)}
                    className="gap-2"
                  >
                    <Lightbulb className="h-4 w-4" />
                    Show hint
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Button */}
      <div className="flex gap-4">
        {!feedback ? (
          <Button 
            onClick={checkAnswer} 
            className="flex-1 h-12"
            disabled={
              (exercise?.type === "translate" || exercise?.type === "listening") 
                ? !userAnswer.trim()
                : !selectedChoice
            }
          >
            Check Answer
          </Button>
        ) : (
          <Button onClick={nextExercise} className="flex-1 h-12 gap-2">
            {currentExercise < lesson.exercises.length - 1 ? "Continue" : "Finish Lesson"}
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
