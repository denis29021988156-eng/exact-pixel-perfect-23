import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { FileSpreadsheet, Upload, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

type Target = 'incident' | 'task' | 'complaint';

const FIELDS_BY_TARGET: Record<Target, { key: string; label: string; required?: boolean }[]> = {
  incident: [
    { key: 'title', label: 'Заголовок', required: true },
    { key: 'description', label: 'Описание' },
    { key: 'type', label: 'Тип (ЖКХ / дорога / …)' },
    { key: 'severity', label: 'Критичность' },
    { key: 'address', label: 'Адрес' },
    { key: 'department', label: 'Департамент' },
    { key: 'responsible', label: 'Ответственный' },
  ],
  task: [
    { key: 'title', label: 'Заголовок', required: true },
    { key: 'description', label: 'Описание' },
    { key: 'department', label: 'Департамент' },
    { key: 'responsible', label: 'Ответственный' },
    { key: 'deadline', label: 'Срок (YYYY-MM-DD)' },
  ],
  complaint: [
    { key: 'topic', label: 'Тема', required: true },
    { key: 'description', label: 'Текст обращения' },
    { key: 'district', label: 'Район' },
  ],
};

export default function ExcelUploadPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [target, setTarget] = useState<Target>('incident');
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: number; failed: number } | null>(null);

  const handleFile = async (file: File) => {
    setResult(null);
    setFileName(file.name);
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
    if (!json.length) {
      toast({ title: 'Файл пустой', variant: 'destructive' });
      return;
    }
    const cols = Object.keys(json[0]);
    setHeaders(cols);
    setRows(json);
    // авто-маппинг по совпадению имён
    const auto: Record<string, string> = {};
    for (const f of FIELDS_BY_TARGET[target]) {
      const match = cols.find((c) => c.toLowerCase().includes(f.label.toLowerCase().split(' ')[0]));
      if (match) auto[f.key] = match;
    }
    setMapping(auto);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async () => {
    const required = FIELDS_BY_TARGET[target].filter((f) => f.required);
    for (const r of required) {
      if (!mapping[r.key]) {
        toast({
          title: 'Не выбрана колонка',
          description: `Обязательное поле «${r.label}» не сопоставлено`,
          variant: 'destructive',
        });
        return;
      }
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ingest-excel', {
        body: { target, fileName, rows, mapping },
      });
      if (error) throw error;
      setResult({ ok: data?.ok ?? 0, failed: data?.failed ?? 0 });
      toast({
        title: 'Загрузка завершена',
        description: `Успешно: ${data?.ok ?? 0}, ошибок: ${data?.failed ?? 0}`,
      });
    } catch (e) {
      toast({ title: 'Ошибка', description: String(e), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFileName('');
    setHeaders([]);
    setRows([]);
    setMapping({});
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Загрузка Excel / CSV</h1>
        <p className="text-muted-foreground mt-1">
          Excel / CSV коннектор. Источник reliability — 85%. Все записи проходят нормализацию и
          получают confidence score.
        </p>
      </div>

      {!rows.length && (
        <Card>
          <CardContent className="p-10">
            <label
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="flex flex-col items-center justify-center gap-4 border-2 border-dashed border-border rounded-xl py-16 cursor-pointer hover:bg-surface-muted transition-colors"
            >
              <Upload className="w-12 h-12 text-muted-foreground" />
              <div className="text-center">
                <p className="text-lg font-medium">Перетащите файл .xlsx / .csv сюда</p>
                <p className="text-sm text-muted-foreground mt-1">или нажмите, чтобы выбрать</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="hidden"
              />
            </label>
          </CardContent>
        </Card>
      )}

      {rows.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                {fileName}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  {rows.length} строк, {headers.length} колонок
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Куда загрузить</Label>
                  <Select
                    value={target}
                    onValueChange={(v: Target) => {
                      setTarget(v);
                      setMapping({});
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="incident">Инциденты</SelectItem>
                      <SelectItem value="task">Поручения</SelectItem>
                      <SelectItem value="complaint">Жалобы граждан</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Сопоставление колонок</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {FIELDS_BY_TARGET[target].map((f) => (
                    <div key={f.key} className="flex items-center gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {f.label}
                          {f.required && <span className="text-danger ml-1">*</span>}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <Select
                        value={mapping[f.key] || '__none__'}
                        onValueChange={(v) =>
                          setMapping((m) => ({ ...m, [f.key]: v === '__none__' ? '' : v }))
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="— не сопоставлено —" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— не сопоставлено —</SelectItem>
                          {headers.map((h) => (
                            <SelectItem key={h} value={h}>
                              {h}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Загрузка…' : `Импортировать ${rows.length} строк`}
                </Button>
                <Button variant="outline" onClick={reset}>
                  Загрузить другой файл
                </Button>
              </div>

              {result && (
                <div className="flex gap-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Успешно: {result.ok}</span>
                  </div>
                  {result.failed > 0 && (
                    <div className="flex items-center gap-2 text-danger">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">Ошибок: {result.failed}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Превью (первые 5 строк)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {headers.map((h) => (
                        <TableHead key={h}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 5).map((r, i) => (
                      <TableRow key={i}>
                        {headers.map((h) => (
                          <TableCell key={h} className="max-w-xs truncate">
                            {String(r[h] ?? '')}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
