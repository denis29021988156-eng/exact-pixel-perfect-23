import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Loader2, Brain, FileText, MapPin, AlertCircle, Building2 } from 'lucide-react';

interface Extracted {
  type: string;
  severity: string;
  address: string | null;
  department: string;
  suggested_title: string;
  political_sensitivity: string;
  confidence: number;
  reasoning?: string;
}

const SAMPLES = [
  'Здравствуйте! Сегодня утром на улице Ленина около дома 12 произошёл прорыв трубы отопления. Без тепла остались несколько домов. Ужас, ребёнок в школу не пошёл. Срочно примите меры!',
  'Добрый день. На Носовихинском шоссе в районе дома 25 огромная яма посреди дороги, машины объезжают по встречке, очень опасно. Нужен срочный ремонт.',
  'В детском саду №7 на улице Гагарина с утра не работает канализация, детей не принимают, родители в панике.',
  'Жители микрорайона Южный жалуются на отсутствие горячей воды уже третий день. Дома 5-15 по улице Южной.',
];

const TYPE_LABEL: Record<string, string> = {
  housing: 'ЖКХ', road: 'Дороги', social: 'Соцобъект',
  ecology: 'Экология', transport: 'Транспорт', other: 'Другое',
};
const SEVERITY_LABEL: Record<string, string> = {
  high: 'Высокая', medium: 'Средняя', low: 'Низкая',
};
const SEVERITY_VARIANT: Record<string, 'destructive' | 'default' | 'secondary'> = {
  high: 'destructive', medium: 'default', low: 'secondary',
};

export default function AIExtractPage() {
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Extracted | null>(null);

  const handleExtract = async () => {
    if (text.trim().length < 5) {
      toast({ title: 'Слишком короткий текст', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-extract-incident', {
        body: { raw_text: text },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data.extracted);
      toast({ title: 'Извлечено успешно', description: `Confidence: ${data.extracted.confidence}%` });
    } catch (e: any) {
      toast({ title: 'Ошибка извлечения', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" /> AI-структурирование
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Phase C · Lovable AI · извлечение структурированных полей из сырого текста писем и обращений
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5">
          <Sparkles className="w-3 h-3" /> gemini-3-flash-preview
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" /> Входной текст
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Вставьте текст письма / жалобы / сообщения..."
              rows={10}
              className="resize-none"
            />
            <div className="flex flex-wrap gap-2">
              {SAMPLES.map((s, i) => (
                <Button key={i} size="sm" variant="outline" onClick={() => setText(s)} className="text-xs">
                  Пример {i + 1}
                </Button>
              ))}
            </div>
            <Button onClick={handleExtract} disabled={loading || text.length < 5} className="w-full">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> AI анализирует...</> :
                <><Sparkles className="w-4 h-4 mr-2" /> Извлечь структуру</>}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="w-4 h-4" /> Структурированный результат
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!result && !loading && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Введите текст и нажмите «Извлечь структуру»
              </div>
            )}
            {loading && (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">AI обрабатывает текст...</p>
              </div>
            )}
            {result && (
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Заголовок</div>
                  <div className="font-semibold text-foreground">{result.suggested_title}</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Тип</div>
                    <Badge variant="outline">{TYPE_LABEL[result.type] || result.type}</Badge>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Срочность</div>
                    <Badge variant={SEVERITY_VARIANT[result.severity]}>
                      {SEVERITY_LABEL[result.severity] || result.severity}
                    </Badge>
                  </div>
                </div>
                {result.address && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Адрес
                    </div>
                    <div className="text-sm text-foreground">{result.address}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> Департамент
                  </div>
                  <div className="text-sm text-foreground">{result.department}</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Полит. чувств.
                    </div>
                    <Badge variant={result.political_sensitivity === 'high' ? 'destructive' : 'outline'}>
                      {SEVERITY_LABEL[result.political_sensitivity]}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Confidence</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${result.confidence}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">{result.confidence}%</span>
                    </div>
                  </div>
                </div>
                {result.reasoning && (
                  <div className="pt-3 border-t border-border">
                    <div className="text-xs text-muted-foreground mb-1">Обоснование AI</div>
                    <div className="text-xs text-foreground/80 italic">{result.reasoning}</div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
