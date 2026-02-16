import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Lock, CheckCircle2, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getLanguageConfig } from "@/lib/languages";

interface Lesson {
  id: string;
  title: string;
  order_index: number;
  xp_reward: number;
  completed?: boolean;
}

interface Unit {
  id: string;
  title: string;
  description: string;
  icon: string;
  order_index: number;
  lessons: Lesson[];
  completedCount: number;
}

export default function LearnPath() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();

  const lang = getLanguageConfig(profile?.target_language || "spanish");

  useEffect(() => {
    async function fetchUnitsAndLessons() {
      try {
        const { data: unitsData, error: unitsError } = await supabase.from("units").select("*").order("order_index");
        if (unitsError) throw unitsError;

        const { data: lessonsData, error: lessonsError } = await supabase.from("lessons").select("*").order("order_index");
        if (lessonsError) throw lessonsError;

        let completedLessonIds: string[] = [];
        if (user) {
          const { data: attempts } = await supabase.from("lesson_attempts").select("lesson_id").eq("user_id", user.id).eq("completed", true);
          completedLessonIds = attempts?.map((a) => a.lesson_id) || [];
        }

        const unitsWithLessons: Unit[] = (unitsData || []).map((unit) => {
          const unitLessons = (lessonsData || []).filter((l) => l.unit_id === unit.id).map((lesson) => ({ ...lesson, completed: completedLessonIds.includes(lesson.id) }));
          return { ...unit, lessons: unitLessons, completedCount: unitLessons.filter((l) => l.completed).length };
        });

        setUnits(unitsWithLessons);
      } catch (error) { console.error("Error fetching units:", error); }
      finally { setLoading(false); }
    }
    fetchUnitsAndLessons();
  }, [user]);

  if (loading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid gap-6 md:grid-cols-2">{[1, 2, 3, 4].map((i) => (<Skeleton key={i} className="h-64 rounded-2xl" />))}</div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold md:text-4xl">{lang.flag} Learning Path</h1>
        <p className="mt-2 text-muted-foreground">Master {lang.label} step by step with structured lessons</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {units.map((unit, index) => {
          const progress = unit.lessons.length > 0 ? (unit.completedCount / unit.lessons.length) * 100 : 0;
          const isLocked = index > 0 && units[index - 1].completedCount < units[index - 1].lessons.length;
          const isCompleted = unit.completedCount === unit.lessons.length && unit.lessons.length > 0;

          return (
            <Card key={unit.id} className={`relative overflow-hidden transition-all duration-300 ${isLocked ? "opacity-60 grayscale" : "hover:shadow-lg hover:-translate-y-1"}`}>
              {isCompleted && (<div className="absolute top-4 right-4"><Badge className="bg-primary text-primary-foreground gap-1"><CheckCircle2 className="h-3 w-3" />Completed</Badge></div>)}
              <CardHeader className="pb-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-3xl">{unit.icon}</div>
                  <div className="flex-1"><CardTitle className="font-display text-xl">{unit.title}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{unit.description}</p></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Progress</span><span className="font-medium">{unit.completedCount}/{unit.lessons.length} lessons</span></div>
                  <Progress value={progress} className="h-2" />
                </div>
                <div className="space-y-2">
                  {unit.lessons.map((lesson, lessonIndex) => {
                    const lessonLocked = lessonIndex > 0 && !unit.lessons[lessonIndex - 1].completed;
                    return (
                      <Link key={lesson.id} to={isLocked || lessonLocked ? "#" : `/lesson/${lesson.id}`} className={isLocked || lessonLocked ? "pointer-events-none" : ""}>
                        <div className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${lesson.completed ? "bg-primary/5 border-primary/20" : isLocked || lessonLocked ? "bg-muted/50" : "hover:bg-muted/50 hover:border-primary/30"}`}>
                          <div className="flex items-center gap-3">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${lesson.completed ? "bg-primary text-primary-foreground" : isLocked || lessonLocked ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                              {lesson.completed ? <CheckCircle2 className="h-4 w-4" /> : isLocked || lessonLocked ? <Lock className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </div>
                            <span className={`font-medium ${isLocked || lessonLocked ? "text-muted-foreground" : ""}`}>{lesson.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">+{lesson.xp_reward} XP</Badge>
                            {!isLocked && !lessonLocked && !lesson.completed && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                {!isLocked && (<Link to={`/lesson/${unit.lessons[0]?.id}`}><Button className="w-full gap-2" disabled={!unit.lessons.length}>{isCompleted ? "Review Unit" : unit.completedCount > 0 ? "Continue" : "Start Unit"}<ChevronRight className="h-4 w-4" /></Button></Link>)}
                {isLocked && (<Button className="w-full gap-2" disabled variant="outline"><Lock className="h-4 w-4" />Complete previous unit to unlock</Button>)}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
