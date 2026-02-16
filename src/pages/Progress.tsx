import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Flame, Zap, BookOpen, Target, TrendingUp, Calendar, Award, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getLanguageConfig } from "@/lib/languages";

interface Stats {
  lessonsCompleted: number;
  totalLessons: number;
  quizAccuracy: number;
  wordsLearned: number;
  speakingAttempts: number;
}

export default function ProgressPage() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<Stats>({ lessonsCompleted: 0, totalLessons: 0, quizAccuracy: 0, wordsLearned: 0, speakingAttempts: 0 });
  const [loading, setLoading] = useState(true);

  const lang = getLanguageConfig(profile?.target_language || "spanish");

  useEffect(() => {
    async function fetchStats() {
      if (!user) { setLoading(false); return; }
      try {
        const { count: completedCount } = await supabase.from("lesson_attempts").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("completed", true);
        const { count: totalLessons } = await supabase.from("lessons").select("*", { count: "exact", head: true });
        const { data: attempts } = await supabase.from("lesson_attempts").select("score").eq("user_id", user.id);
        const avgScore = attempts?.length ? Math.round(attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length) : 0;
        const { count: wordsLearned } = await supabase.from("user_vocab_progress").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("strength", 50);
        const { count: speakingAttempts } = await supabase.from("pronunciation_attempts").select("*", { count: "exact", head: true }).eq("user_id", user.id);
        setStats({ lessonsCompleted: completedCount || 0, totalLessons: totalLessons || 0, quizAccuracy: avgScore, wordsLearned: wordsLearned || 0, speakingAttempts: speakingAttempts || 0 });
      } catch (error) { console.error("Error fetching stats:", error); }
      finally { setLoading(false); }
    }
    fetchStats();
  }, [user]);

  if (!user) {
    return (
      <div className="container py-8">
        <Card className="text-center p-8">
          <CardTitle className="mb-4">Sign in to track your progress</CardTitle>
          <p className="text-muted-foreground mb-6">Create an account to save your learning progress.</p>
          <Link to="/auth"><Button>Sign in or Sign up</Button></Link>
        </Card>
      </div>
    );
  }

  const lessonsProgress = stats.totalLessons > 0 ? (stats.lessonsCompleted / stats.totalLessons) * 100 : 0;

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">{lang.flag} Your Progress</h1>
        <p className="text-muted-foreground">Track your {lang.label} learning journey</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Current Streak</p><p className="text-3xl font-bold text-streak">{profile?.streak_days || 0}</p><p className="text-xs text-muted-foreground">days</p></div><div className="h-12 w-12 rounded-full bg-streak/10 flex items-center justify-center"><Flame className="h-6 w-6 text-streak" /></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total XP</p><p className="text-3xl font-bold text-xp">{profile?.xp_points || 0}</p><p className="text-xs text-muted-foreground">points</p></div><div className="h-12 w-12 rounded-full bg-xp/10 flex items-center justify-center"><Zap className="h-6 w-6 text-xp" /></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Lessons Done</p><p className="text-3xl font-bold">{stats.lessonsCompleted}</p><p className="text-xs text-muted-foreground">of {stats.totalLessons}</p></div><div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center"><BookOpen className="h-6 w-6 text-primary" /></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Words Learned</p><p className="text-3xl font-bold">{stats.wordsLearned}</p><p className="text-xs text-muted-foreground">vocabulary</p></div><div className="h-12 w-12 rounded-full bg-info/10 flex items-center justify-center"><Target className="h-6 w-6 text-info" /></div></div></CardContent></Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><BookOpen className="h-5 w-5 text-primary" />Lesson Progress</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><div className="flex justify-between text-sm"><span>Overall Progress</span><span className="font-medium">{Math.round(lessonsProgress)}%</span></div><Progress value={lessonsProgress} className="h-3" /></div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg"><p className="text-2xl font-bold text-primary">{stats.lessonsCompleted}</p><p className="text-xs text-muted-foreground">Completed</p></div>
              <div className="text-center p-4 bg-muted/50 rounded-lg"><p className="text-2xl font-bold">{stats.totalLessons - stats.lessonsCompleted}</p><p className="text-xs text-muted-foreground">Remaining</p></div>
            </div>
            <Link to="/learn"><Button className="w-full" variant="outline">Continue Learning</Button></Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><TrendingUp className="h-5 w-5 text-primary" />Quiz Performance</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-6">
              <div className="relative inline-flex items-center justify-center">
                <svg className="h-32 w-32 -rotate-90"><circle cx="64" cy="64" r="56" fill="none" stroke="hsl(var(--muted))" strokeWidth="12" /><circle cx="64" cy="64" r="56" fill="none" stroke="hsl(var(--primary))" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(stats.quizAccuracy / 100) * 352} 352`} /></svg>
                <div className="absolute text-center"><p className="text-3xl font-bold">{stats.quizAccuracy}%</p><p className="text-xs text-muted-foreground">Accuracy</p></div>
              </div>
            </div>
            <div className="flex justify-center gap-4"><Badge variant="secondary" className="gap-1"><Target className="h-3 w-3" />{stats.speakingAttempts} speaking attempts</Badge></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Award className="h-5 w-5 text-primary" />Current Level</CardTitle></CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <div className="h-20 w-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-3xl">{profile?.level === "beginner" ? "🌱" : profile?.level === "intermediate" ? "🌿" : "🌳"}</span>
              </div>
              <p className="text-xl font-bold capitalize">{profile?.level || "Beginner"}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {profile?.level === "beginner" ? `Just getting started — ${lang.greeting}` : profile?.level === "intermediate" ? "Making great progress!" : "Impressive skills!"}
              </p>
            </div>
            <Link to="/settings"><Button className="w-full" variant="outline">Adjust Settings</Button></Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><AlertTriangle className="h-5 w-5 text-warning" />Focus Areas</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"><span className="text-sm">Speaking practice</span><Badge variant="secondary">Needs work</Badge></div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"><span className="text-sm">Verb conjugations</span><Badge variant="secondary">Review</Badge></div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"><span className="text-sm">Grammar patterns</span><Badge variant="secondary">Practice</Badge></div>
            </div>
            <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div><p className="font-medium text-sm">Daily Goal</p><p className="text-xs text-muted-foreground">Complete at least 1 lesson per day to maintain your streak!</p></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
