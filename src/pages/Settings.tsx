import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { LANGUAGE_LIST } from "@/lib/languages";
import type { TargetLanguage } from "@/lib/languages";

export default function Settings() {
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [level, setLevel] = useState(profile?.level || "beginner");
  const [coachStyle, setCoachStyle] = useState(profile?.coach_style || "gentle");
  const [explainInEnglish, setExplainInEnglish] = useState(profile?.explain_in_english ?? true);
  const [speakingSpeed, setSpeakingSpeed] = useState(profile?.speaking_speed || "normal");
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguage>(profile?.target_language || "spanish");

  if (!user) {
    return (
      <div className="container py-8">
        <Card className="text-center p-8">
          <CardTitle className="mb-4">Sign in to access settings</CardTitle>
          <Link to="/auth">
            <Button>Sign in</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile({
        level,
        coach_style: coachStyle,
        explain_in_english: explainInEnglish,
        speaking_speed: speakingSpeed,
        target_language: targetLanguage,
      });
      toast({
        title: "Settings saved!",
        description: "Your preferences have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Customize your learning experience</p>
      </div>

      <div className="space-y-6">
        {/* Target Language */}
        <Card>
          <CardHeader>
            <CardTitle>Learning Language</CardTitle>
            <CardDescription>Which language are you learning?</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={targetLanguage} onValueChange={(v) => setTargetLanguage(v as TargetLanguage)} className="space-y-3">
              {LANGUAGE_LIST.map((lang) => (
                <div key={lang.id} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value={lang.id} id={`lang-${lang.id}`} />
                  <Label htmlFor={`lang-${lang.id}`} className="flex-1 cursor-pointer">
                    <div className="font-medium">{lang.flag} {lang.label}</div>
                    <div className="text-sm text-muted-foreground">{lang.nativeName}</div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Learning Level */}
        <Card>
          <CardHeader>
            <CardTitle>Learning Level</CardTitle>
            <CardDescription>Choose your current proficiency</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={level} onValueChange={setLevel} className="space-y-3">
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="beginner" id="beginner" />
                <Label htmlFor="beginner" className="flex-1 cursor-pointer">
                  <div className="font-medium">🌱 Beginner</div>
                  <div className="text-sm text-muted-foreground">New or know a few words</div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="intermediate" id="intermediate" />
                <Label htmlFor="intermediate" className="flex-1 cursor-pointer">
                  <div className="font-medium">🌿 Intermediate</div>
                  <div className="text-sm text-muted-foreground">Can have basic conversations</div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="advanced" id="advanced" />
                <Label htmlFor="advanced" className="flex-1 cursor-pointer">
                  <div className="font-medium">🌳 Advanced</div>
                  <div className="text-sm text-muted-foreground">Comfortable but want to perfect my skills</div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Coach Style */}
        <Card>
          <CardHeader>
            <CardTitle>Coach Style</CardTitle>
            <CardDescription>How should the tutor correct your mistakes?</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={coachStyle} onValueChange={setCoachStyle} className="space-y-3">
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="gentle" id="gentle" />
                <Label htmlFor="gentle" className="flex-1 cursor-pointer">
                  <div className="font-medium">😊 Gentle</div>
                  <div className="text-sm text-muted-foreground">Encouraging feedback with soft corrections</div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="strict" id="strict" />
                <Label htmlFor="strict" className="flex-1 cursor-pointer">
                  <div className="font-medium">📝 Strict</div>
                  <div className="text-sm text-muted-foreground">Direct corrections with detailed explanations</div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Speaking Speed */}
        <Card>
          <CardHeader>
            <CardTitle>Speaking Speed</CardTitle>
            <CardDescription>Audio playback speed for listening exercises</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={speakingSpeed} onValueChange={setSpeakingSpeed} className="space-y-3">
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="slow" id="slow" />
                <Label htmlFor="slow" className="flex-1 cursor-pointer">
                  <div className="font-medium">🐢 Slow</div>
                  <div className="text-sm text-muted-foreground">Slower pace for careful listening</div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="normal" id="normal" />
                <Label htmlFor="normal" className="flex-1 cursor-pointer">
                  <div className="font-medium">🚶 Normal</div>
                  <div className="text-sm text-muted-foreground">Natural conversational speed</div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="fast" id="fast" />
                <Label htmlFor="fast" className="flex-1 cursor-pointer">
                  <div className="font-medium">🏃 Fast</div>
                  <div className="text-sm text-muted-foreground">Challenge yourself with native speed</div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* English Explanations */}
        <Card>
          <CardHeader>
            <CardTitle>English Explanations</CardTitle>
            <CardDescription>Include English translations in feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Show English explanations</p>
                <p className="text-sm text-muted-foreground">Get grammar tips and corrections in English</p>
              </div>
              <Switch checked={explainInEnglish} onCheckedChange={setExplainInEnglish} />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={loading} className="w-full" size="lg">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
