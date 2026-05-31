"use client";

import * as React from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  verdaAiBootstrapAction,
  verdaAiChatAction,
} from "@/app/(dashboard)/ai/actions";
import type { VerdaAiInsight } from "@/lib/verda-ai/generate";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface VerdaAiPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

function priorityVariant(priority: VerdaAiInsight["priority"]) {
  if (priority === "high") return "destructive" as const;
  if (priority === "medium") return "warning" as const;
  return "secondary" as const;
}

export function VerdaAiPanel({ open, onOpenChange }: VerdaAiPanelProps) {
  const [loading, setLoading] = React.useState(false);
  const [bootstrapping, setBootstrapping] = React.useState(false);
  const [insights, setInsights] = React.useState<VerdaAiInsight[]>([]);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [llmEnabled, setLlmEnabled] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;

    setBootstrapping(true);
    void verdaAiBootstrapAction()
      .then((res) => {
        if (res.error) {
          toast.error("Verda AI no disponible", { description: res.error });
          return;
        }
        setInsights(res.insights ?? []);
        setSuggestions(res.suggestions ?? []);
        setLlmEnabled(Boolean(res.llmEnabled));
        setMessages(
          res.welcome
            ? [{ role: "assistant", content: res.welcome }]
            : [],
        );
      })
      .finally(() => setBootstrapping(false));
  }, [open]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await verdaAiChatAction(nextMessages);
      if (res.error || !res.reply) {
        toast.error("No se pudo responder", { description: res.error });
        setMessages((prev) => prev.slice(0, -1));
        return;
      }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.reply! },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed inset-y-0 right-0 left-auto top-0 flex h-[100dvh] w-full max-w-md translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-l border-border/60 p-0 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-md">
        <DialogHeader className="shrink-0 border-b border-border/60 px-4 py-4 text-left">
          <div className="flex items-center gap-2 pr-8">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15">
              <Sparkles className="h-4 w-4 text-primary" />
            </span>
            <div>
              <DialogTitle>Verda AI</DialogTitle>
              <DialogDescription>
                Asistente operativo de tu club
                {llmEnabled ? " · IA avanzada" : " · modo inteligente"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {bootstrapping ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {insights.length > 0 && (
              <div className="shrink-0 space-y-2 border-b border-border/60 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Alertas
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {insights.map((insight) => (
                    <div
                      key={insight.title}
                      className="min-w-[200px] shrink-0 rounded-xl border border-border/60 bg-secondary/30 p-3"
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <Badge variant={priorityVariant(insight.priority)} className="h-5 text-[10px]">
                          {insight.title}
                        </Badge>
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {insight.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              ref={scrollRef}
              className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4"
            >
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={cn(
                    "max-w-[92%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed",
                    message.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "mr-auto border border-border/60 bg-secondary/40 text-foreground",
                  )}
                >
                  <p className="whitespace-pre-wrap">
                    {renderInlineMarkdown(message.content)}
                  </p>
                </div>
              ))}
              {loading && (
                <div className="mr-auto flex items-center gap-2 rounded-2xl border border-border/60 bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Pensando…
                </div>
              )}
            </div>

            {suggestions.length > 0 && (
              <div className="shrink-0 border-t border-border/60 px-4 py-2">
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      disabled={loading}
                      onClick={() => void sendMessage(suggestion)}
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="shrink-0 border-t border-border/60 p-4"
            >
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Pregunta sobre socios, pedidos, stock…"
                  disabled={loading}
                  className="min-h-11 flex-1 rounded-xl border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-11 w-11 shrink-0"
                  disabled={loading || !input.trim()}
                  aria-label="Enviar"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
