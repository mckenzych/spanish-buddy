import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  BookOpen, 
  MessageCircle, 
  Mic, 
  Brain, 
  Sparkles, 
  ChevronRight,
  Zap,
  Users,
  Globe
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getLanguageConfig } from "@/lib/languages";

const features = [
  {
    icon: BookOpen,
    title: "Structured Lessons",
    description: "Learn step-by-step with Duolingo-style exercises covering reading, writing, listening, and speaking.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: MessageCircle,
    title: "AI Chat Tutor",
    description: "Practice conversations with an intelligent tutor that corrects your mistakes and explains grammar.",
    color: "text-info",
    bg: "bg-info/10",
  },
  {
    icon: Mic,
    title: "Pronunciation Practice",
    description: "Speak and get instant feedback on your pronunciation with speech recognition.",
    color: "text-streak",
    bg: "bg-streak/10",
  },
  {
    icon: Brain,
    title: "Smart Review",
    description: "Our system tracks your mistakes and creates personalized review sessions to strengthen weak areas.",
    color: "text-accent-foreground",
    bg: "bg-accent/20",
  },
];

const stats = [
  { value: "4", label: "Languages", icon: Globe },
  { value: "∞", label: "Practice Sessions", icon: Zap },
  { value: "AI", label: "Powered Tutor", icon: Sparkles },
];

export default function Home() {
  const { user, profile } = useAuth();
  const lang = getLanguageConfig(profile?.target_language || "spanish");

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <div className="container relative py-20 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              AI-Powered Language Learning
            </div>
            
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Learn Languages the
              <span className="relative mx-2">
                <span className="relative z-10 text-primary">Smart</span>
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 200 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 8C50 2 150 2 198 8"
                    stroke="hsl(var(--primary))"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="opacity-30"
                  />
                </svg>
              </span>
              Way
            </h1>
            
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              Master {lang.label}, French, Italian, English & more with interactive lessons, 
              AI chat tutoring, and real-time pronunciation feedback. Balanced learning: 
              reading, writing, listening, and speaking.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={user ? "/learn" : "/auth?mode=signup"}>
                <Button size="lg" className="gap-2 text-lg px-8 py-6 shadow-glow hover:shadow-xl transition-shadow">
                  {user ? "Continue Learning" : "Start Learning Free"}
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/learn">
                <Button variant="outline" size="lg" className="gap-2 text-lg px-8 py-6">
                  <Globe className="h-5 w-5" />
                  Explore Lessons
                </Button>
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="mt-16 grid grid-cols-3 gap-4 md:gap-8">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="text-center">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Everything You Need to Learn a New Language
            </h2>
            <p className="mt-4 text-muted-foreground">
              Balanced skill development with modern AI technology
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.bg}`}>
                      <Icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <h3 className="mb-2 font-display text-lg font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <Card className="relative overflow-hidden border-0 gradient-hero text-white">
            <CardContent className="relative z-10 p-8 md:p-12 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 opacity-80" />
              <h2 className="font-display text-2xl font-bold md:text-3xl">
                Ready to Start Your Language Journey?
              </h2>
              <p className="mt-4 text-white/80 max-w-xl mx-auto">
                Join thousands of learners improving their language skills every day. 
                No credit card required — start learning for free!
              </p>
              <Link to={user ? "/learn" : "/auth?mode=signup"}>
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="mt-8 gap-2 text-lg"
                >
                  {user ? "Go to Lessons" : "Create Free Account"}
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
