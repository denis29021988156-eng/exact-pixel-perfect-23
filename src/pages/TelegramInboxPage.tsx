import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ConfidenceBadge from "@/components/ConfidenceBadge";
import { toast } from "sonner";
import { Send, RefreshCw, MessageSquare, CheckCircle2, AlertCircle, Clock } from "lucide-react";

type TgMessage = {
  update_id: number;
  chat_id: number;
  chat_title: string | null;
  from_username: string | null;
  text: string | null;
  processed: boolean;
  confidence: number;
  extracted_payload: any;
  error_message: string | null;
  created_at: string;
};

export default function TelegramInboxPage() {
  const [messages, setMessages] = useState<TgMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [lastPoll, setLastPoll] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("telegram_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      toast.error("Не удалось загрузить сообщения: " + error.message);
    } else {
      setMessages((data ?? []) as TgMessage[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("telegram-inbox")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "telegram_messages" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const triggerPoll = async () => {
    setPolling(true);
    setLastPoll(null);
    try {
      const { data, error } = await supabase.functions.invoke("telegram-poll", {
        body: {},
      });
      if (error) throw error;
      setLastPoll(data);
      if (data?.processed > 0) {
        toast.success(
          `Получено ${data.processed} сообщений, извлечено: ${data.extracted}`,
        );
      } else {
        toast.info("Новых сообщений нет");
      }
      await load();
    } catch (e: any) {
      toast.error("Ошибка polling: " + (e?.message ?? "unknown"));
    } finally {
      setPolling(false);
    }
  };

  const totalCount = messages.length;
  const processedCount = messages.filter((m) => m.processed).length;
  const extractedCount = messages.filter((m) => m.extracted_payload).length;
  const errorCount = messages.filter((m) => m.error_message).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Telegram</h1>
          <p className="text-muted-foreground mt-1">
            Сообщения из городского чата жалоб с автоматическим AI-извлечением
            структуры
          </p>
        </div>
        <Button
          onClick={triggerPoll}
          disabled={polling}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${polling ? "animate-spin" : ""}`} />
          {polling ? "Опрос..." : "Получить новые"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <MessageSquare className="w-4 h-4" />
            Всего сообщений
          </div>
          <div className="text-2xl font-bold mt-1">{totalCount}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <CheckCircle2 className="w-4 h-4 text-success" />
            Обработано
          </div>
          <div className="text-2xl font-bold mt-1">{processedCount}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Send className="w-4 h-4 text-primary" />
            Извлечено AI
          </div>
          <div className="text-2xl font-bold mt-1">{extractedCount}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <AlertCircle className="w-4 h-4 text-danger" />
            Ошибок
          </div>
          <div className="text-2xl font-bold mt-1">{errorCount}</div>
        </Card>
      </div>

      {lastPoll && (
        <Card className="p-4 bg-surface-muted">
          <div className="text-xs text-muted-foreground">
            Последний опрос: получено <b>{lastPoll.processed}</b>, извлечено{" "}
            <b>{lastPoll.extracted}</b>, ошибок <b>{lastPoll.errors}</b>, offset{" "}
            <b>{lastPoll.finalOffset}</b>
          </div>
        </Card>
      )}

      {/* Messages list */}
      <Card className="divide-y divide-border">
        <div className="p-4 flex items-center justify-between">
          <h2 className="font-semibold">Последние сообщения</h2>
          <Badge variant="outline">{messages.length} / 50</Badge>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Загрузка...</div>
        ) : messages.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground space-y-3">
            <MessageSquare className="w-10 h-10 mx-auto opacity-30" />
            <div>Сообщений пока нет</div>
            <div className="text-xs">
              Добавьте бота в Telegram-чат и нажмите «Получить новые». Бот будет
              видеть только новые сообщения, отправленные после его добавления.
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const ex = m.extracted_payload;
            return (
              <div key={m.update_id} className="p-4 space-y-2 hover:bg-surface-muted/50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        @{m.from_username ?? "unknown"}
                      </span>
                      {m.chat_title && (
                        <>
                          <span>·</span>
                          <span>{m.chat_title}</span>
                        </>
                      )}
                      <span>·</span>
                      <Clock className="w-3 h-3" />
                      <span>{new Date(m.created_at).toLocaleString("ru-RU")}</span>
                    </div>
                    <div className="text-sm mt-1 break-words">
                      {m.text ?? <i className="text-muted-foreground">Без текста</i>}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {!m.processed ? (
                      <Badge variant="outline" className="gap-1">
                        <Clock className="w-3 h-3" /> В очереди
                      </Badge>
                    ) : m.error_message ? (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="w-3 h-3" /> Ошибка
                      </Badge>
                    ) : ex ? (
                      <ConfidenceBadge score={m.confidence} />
                    ) : (
                      <Badge variant="secondary">Пропущено</Badge>
                    )}
                  </div>
                </div>

                {ex && (
                  <div className="flex flex-wrap gap-2 pt-1 text-xs">
                    <Badge variant="secondary">type: {ex.type}</Badge>
                    <Badge variant="secondary">severity: {ex.severity}</Badge>
                    {ex.address && (
                      <Badge variant="outline">📍 {ex.address}</Badge>
                    )}
                    {ex.department && (
                      <Badge variant="outline">{ex.department}</Badge>
                    )}
                    {ex.political_sensitivity === "high" && (
                      <Badge variant="destructive">⚠ Полит.чувствительно</Badge>
                    )}
                  </div>
                )}

                {ex?.suggested_title && (
                  <div className="text-xs text-muted-foreground italic">
                    Предложенный заголовок: «{ex.suggested_title}»
                  </div>
                )}

                {m.error_message && (
                  <div className="text-xs text-danger bg-danger-soft/50 p-2 rounded">
                    {m.error_message}
                  </div>
                )}
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}
