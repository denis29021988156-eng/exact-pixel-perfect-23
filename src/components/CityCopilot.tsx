import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2, Sparkles, UserCheck, Calendar, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { trimMessages } from '@/lib/ai/conversationState';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type TaskSuggestion = {
  assignee_user_id: string;
  title: string;
  deadline: string;
  department: string;
};
type Msg = {
  role: 'user' | 'assistant';
  content: string;
  suggestions?: TaskSuggestion[];
  sentSuggestionIdx?: number[];
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/city-copilot`;

const quickCommands = [
  { label: 'Что критично?', msg: 'Что сейчас критично в городе?' },
  { label: 'Риски', msg: 'Покажи все текущие риски и Risk Index' },
  { label: 'Просроченные', msg: 'Какие инциденты и поручения просрочены?' },
  { label: 'Доклад', msg: 'Подготовь краткий доклад по текущей ситуации с рекомендуемыми действиями' },
  { label: 'Дать поручение', msg: 'Предложи поручение по самому критичному инциденту: кому конкретно, что сделать и к какому сроку.' },
];

function parseTaskSuggestions(raw: string): TaskSuggestion[] {
  const re = /TASK_SUGGEST:\s*assignee_user_id=([0-9a-f-]{36});\s*title=([^;\n]+);\s*deadline=(\d{4}-\d{2}-\d{2});\s*department=(utilities|transport|improvement|social|construction)/gi;
  const out: TaskSuggestion[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    out.push({
      assignee_user_id: m[1].trim(),
      title: m[2].trim().slice(0, 200),
      deadline: m[3].trim(),
      department: m[4].trim(),
    });
  }
  return out;
}

const deptLabels: Record<string, string> = {
  utilities: 'ЖКХ',
  transport: 'Транспорт',
  improvement: 'Благоустройство',
  social: 'Соц. сфера',
  construction: 'Строительство',
};

export default function CityCopilot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [staff, setStaff] = useState<Record<string, { full_name: string; position: string; department: string }>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const messagesRef = useRef<Msg[]>([]);
  const sendRef = useRef<(text: string) => Promise<void>>();
  const { toast } = useToast();

  useEffect(() => { messagesRef.current = messages; }, [messages]);

  useEffect(() => {
    if (!open) return;
    supabase.from('profiles').select('user_id, full_name, position, department').then(({ data }) => {
      const map: Record<string, { full_name: string; position: string; department: string }> = {};
      (data || []).forEach((p: any) => {
        if (p.user_id) map[p.user_id] = { full_name: p.full_name, position: p.position || '', department: p.department || '' };
      });
      setStaff(map);
    });
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // External trigger: open copilot with a briefing as context and ask AI to turn recommendations into pickable tasks
  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent).detail || {};
      const briefingText: string = detail.briefing || '';
      if (!briefingText.trim()) return;
      sessionIdRef.current = crypto.randomUUID();
      const ctxMsg: Msg = {
        role: 'assistant',
        content: `**Контекст — последняя AI-сводка для руководства:**\n\n${briefingText}`,
      };
      setMessages([ctxMsg]);
      setOpen(true);
      // Auto-send a follow-up so AI returns TASK_SUGGEST cards the mayor can pick from
      setTimeout(() => {
        send('На основе рекомендаций из сводки выше сформулируй конкретные поручения (по одному TASK_SUGGEST на каждую рекомендацию: реальный ответственный из списка, чёткая формулировка, реалистичный срок). Я выберу, какие отправить — все, часть или ни одного.');
      }, 50);
    }
    window.addEventListener('copilot:open-with-briefing', handler as EventListener);
    return () => window.removeEventListener('copilot:open-with-briefing', handler as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendTask = async (msgIdx: number, sugIdx: number) => {
    const msg = messages[msgIdx];
    const s = msg.suggestions?.[sugIdx];
    if (!s) return;
    const { data: userData } = await supabase.auth.getUser();
    const creator = userData?.user?.user_metadata?.full_name || userData?.user?.email || 'Мэр';
    const responsible = staff[s.assignee_user_id]?.full_name || '';
    const { error } = await supabase.from('tasks').insert({
      title: s.title,
      deadline: s.deadline,
      department: s.department,
      assigned_to: s.assignee_user_id,
      responsible,
      created_by_name: creator,
      status: 'new',
    });
    if (error) {
      toast({ title: 'Не удалось создать поручение', description: error.message, variant: 'destructive' });
      return;
    }
    setMessages(prev => prev.map((m, i) => {
      if (i !== msgIdx) return m;
      const sent = new Set(m.sentSuggestionIdx || []);
      sent.add(sugIdx);
      return { ...m, sentSuggestionIdx: Array.from(sent) };
    }));
    toast({ title: 'Поручение отправлено', description: `${responsible || 'Исполнитель'} · до ${s.deadline}` });
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Msg = { role: 'user', content: trimmed };
    const allMessages = [...messagesRef.current, userMsg];
    setMessages(allMessages);
    setInput('');
    setIsLoading(true);

    let assistantSoFar = '';

    try {
      // Trim messages for context control (last 6)
      const messagesToSend = trimMessages(allMessages.map(({ role, content }) => ({ role, content })));

      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ messages: messagesToSend, session_id: sessionIdRef.current }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) throw new Error('Превышен лимит запросов');
        if (resp.status === 402) throw new Error('Необходимо пополнить баланс');
        throw new Error('Ошибка AI');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              const visible = assistantSoFar
                .replace(/MEMORY_SAVE:[^\n]*/g, '')
                .replace(/MEMORY_DELETE:[^\n]*/g, '')
                .replace(/TASK_SUGGEST:[^\n]*/g, '')
                .replace(/\n{3,}/g, '\n\n')
                .trimEnd();
              const suggestions = parseTaskSuggestions(assistantSoFar);
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: visible, suggestions } : m);
                }
                return [...prev, { role: 'assistant', content: visible, suggestions }];
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${e.message || 'Произошла ошибка'}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center"
        title="City Copilot"
      >
        <Bot className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[420px] h-[600px] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">City Copilot</h3>
            <p className="text-[10px] text-muted-foreground">AI-ассистент · temp 0.3 · контекст: {Math.min(messages.length, 6)} msg</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-8 w-8">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <Sparkles className="w-10 h-10 text-primary/40 mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">Здравствуйте!</p>
            <p className="text-xs text-muted-foreground mb-4">Я Ваш AI-ассистент. Спросите о ситуации в городе.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {quickCommands.map(cmd => (
                <button
                  key={cmd.label}
                  onClick={() => send(cmd.msg)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-muted/50 text-foreground hover:bg-accent transition-colors"
                >
                  {cmd.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col gap-2 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                  m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                }`}>
                  {m.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-1.5 [&>ul]:mb-1.5 [&>ol]:mb-1.5 [&>h1]:text-base [&>h2]:text-sm [&>h3]:text-sm">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : m.content}
                </div>
                {m.role === 'assistant' && m.suggestions?.map((s, sIdx) => {
                  const sent = m.sentSuggestionIdx?.includes(sIdx);
                  const person = staff[s.assignee_user_id];
                  return (
                    <div key={sIdx} className="max-w-[85%] w-full rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs">
                      <div className="flex items-center gap-2 mb-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-primary" />
                        <span className="font-semibold text-foreground">Поручение</span>
                        <span className="ml-auto text-[10px] text-muted-foreground">{deptLabels[s.department] || s.department}</span>
                      </div>
                      <p className="font-medium text-foreground mb-1.5 leading-snug">{s.title}</p>
                      <div className="flex items-center gap-3 text-muted-foreground mb-2">
                        <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" />{person?.full_name || 'Исполнитель'}{person?.position ? ` · ${person.position}` : ''}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />до {s.deadline}</span>
                      </div>
                      {sent ? (
                        <div className="flex items-center gap-1.5 text-success text-xs font-semibold"><CheckCircle2 className="w-3.5 h-3.5" /> Отправлено</div>
                      ) : (
                        <Button size="sm" className="h-7 text-xs px-3" onClick={() => sendTask(i, sIdx)}>Отправить</Button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-xl px-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="px-3 py-3 border-t border-border">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Спросите что-нибудь..."
            className="min-h-[40px] max-h-[100px] resize-none text-sm"
            rows={1}
          />
          <Button
            size="icon"
            onClick={() => send(input)}
            disabled={!input.trim() || isLoading}
            className="h-10 w-10 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
