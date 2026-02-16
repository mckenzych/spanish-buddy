import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { 
  Send, Sparkles, MessageCircle, RefreshCw, Lightbulb, CheckCircle2, Bot, User
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getLanguageConfig } from "@/lib/languages";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const topics = [
  { value: "general", label: "General Conversation" },
  { value: "travel", label: "Travel & Directions" },
  { value: "food", label: "Food & Restaurant" },
  { value: "introductions", label: "Introductions" },
  { value: "shopping", label: "Shopping" },
  { value: "daily", label: "Daily Routine" },
];

export default function ChatTutor() {
  const [mode, setMode] = useState<"coach" | "free">("coach");
  const [topic, setTopic] = useState("general");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const lang = getLanguageConfig(profile?.target_language || "spanish");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const greeting: Message = {
      id: "welcome",
      role: "assistant",
      content: mode === "coach" 
        ? `${lang.greeting} 👋 I'm your ${lang.label} coach. Let's practice together! Write something in ${lang.label}, and I'll help you improve. Don't worry about mistakes — that's how we learn!`
        : `${lang.greeting} 👋 Let's have a conversation in ${lang.label}. I'll only correct you if you ask. What would you like to talk about?`,
    };
    setMessages([greeting]);
  }, [mode, lang.id]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke("spanish-tutor", {
        body: {
          message: input,
          mode,
          topic,
          conversationHistory: messages.map((m) => ({ role: m.role, content: m.content })),
          userLevel: profile?.level || "beginner",
          coachStyle: profile?.coach_style || "gentle",
          explainInEnglish: profile?.explain_in_english ?? true,
          targetLanguage: profile?.target_language || "spanish",
        },
      });

      if (response.error) throw response.error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.data.reply || "Sorry, there was an error. Please try again.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Chat error:", error);
      toast({ title: "Error", description: error.message || "Failed to send message.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">{lang.label} Chat Tutor</h1>
        <p className="text-muted-foreground">Practice {lang.label} in real conversations</p>
      </div>

      <Tabs value={mode} onValueChange={(v) => setMode(v as "coach" | "free")}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <TabsList className="grid w-full sm:w-auto grid-cols-2">
            <TabsTrigger value="coach" className="gap-2"><Sparkles className="h-4 w-4" />Coach Mode</TabsTrigger>
            <TabsTrigger value="free" className="gap-2"><MessageCircle className="h-4 w-4" />Free Chat</TabsTrigger>
          </TabsList>
          <Select value={topic} onValueChange={setTopic}>
            <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Select topic" /></SelectTrigger>
            <SelectContent>
              {topics.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="coach" className="mt-0">
          <Badge variant="secondary" className="mb-4">✏️ I'll correct your {lang.label} and explain grammar</Badge>
        </TabsContent>
        <TabsContent value="free" className="mt-0">
          <Badge variant="secondary" className="mb-4">💬 Natural conversation — corrections only when you ask</Badge>
        </TabsContent>
      </Tabs>

      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-muted/30 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              {lang.flag} Language Buddy
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setMessages([])} className="gap-2">
              <RefreshCw className="h-4 w-4" />New Chat
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <ScrollArea className="h-[400px] p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted"><Bot className="h-4 w-4" /></div>
                  <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-2">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex gap-2 p-4 pt-0">
            <Button variant="outline" size="sm" onClick={() => setInput("Can you correct my last message?")} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />Correct me
            </Button>
            <Button variant="outline" size="sm" onClick={() => setInput("Give me a hint for what to say next")} className="gap-2">
              <Lightbulb className="h-4 w-4" />Give hint
            </Button>
          </div>

          <div className="border-t p-4">
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
              <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Type in ${lang.label} or English...`} disabled={isLoading} className="flex-1" />
              <Button type="submit" disabled={isLoading || !input.trim()}><Send className="h-4 w-4" /></Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {!user && (
        <p className="mt-4 text-center text-sm text-muted-foreground">Sign in to save your chat history and track progress</p>
      )}
    </div>
  );
}
