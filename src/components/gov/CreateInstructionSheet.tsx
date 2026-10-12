import { useEffect, useState } from "react";
import { Quote } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ios/Button";
import { DateInput, FieldRow, FieldStack, FormGroup, TextArea } from "@/components/ios/Form";
import { Sheet } from "@/components/ios/Sheet";
import { useDirectory } from "@/lib/directory";
import { addDays, fmtDay, mskToday } from "@/lib/format";
import type { PromiseItem } from "@/lib/types";
import { useCreateFlow } from "./actions";
import { ExecutorSelect, MunicipalitySelect } from "./Pickers";

// Подсказка исполнителя по смыслу обещания: «поликлиника» — здравоохранение и т. п.
const EXECUTOR_HINTS: [RegExp, string][] = [
  [/поликлиник|больниц|врач|терапевт|фап|медиц/i, "здравоохранения"],
  [/школ|детск\S* сад|учител|образован/i, "образования"],
  [/газ|тепл|отоплен|водоснаб|воду|канализ|жкх|электр/i, "ЖКХ"],
  [/дорог|мост|трасс|автобус|электрич|транспорт/i, "транспорта"],
  [/мусор|свалк|отход|эколог/i, "экологии"],
  [/соцзащит|пенсион|льгот|многодет/i, "социальной защиты"],
  [/строит|жиль|капремонт/i, "строительства"],
];

function guessExecutor(text: string, executors: { id: string; name: string }[]): string {
  for (const [re, key] of EXECUTOR_HINTS) {
    if (re.test(text)) {
      const e = executors.find((x) => x.name.includes(key));
      if (e) return e.id;
    }
  }
  return "";
}

/** Новое поручение. Если передано обещание — поручение по нему. */
export function CreateInstructionSheet({
  open,
  onClose,
  promise,
}: {
  open: boolean;
  onClose: () => void;
  promise?: PromiseItem | null;
}) {
  const today = mskToday();
  const flow = useCreateFlow();
  const dir = useDirectory();
  const [title, setTitle] = useState("");
  const [executorId, setExecutorId] = useState("");
  const [due, setDue] = useState(addDays(today, 7));
  const [municipalityId, setMunicipalityId] = useState("");
  const [details, setDetails] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(promise ? promise.text : "");
    setExecutorId("");
    const week = addDays(today, 7);
    setDue(promise?.due_date && promise.due_date > today && promise.due_date < week ? promise.due_date : week);
    setMunicipalityId(promise?.municipality?.id ?? "");
    setDetails(promise ? `Обещание: ${promise.occasion}, ${fmtDay(promise.said_on, today)}.` : "");
  }, [open, promise, today]);

  // Для обещания сразу предлагаем исполнителя — останется только нажать «Поручить».
  useEffect(() => {
    if (!open || !promise || !dir.data) return;
    setExecutorId((cur) => cur || guessExecutor(promise.text, dir.data.executors));
  }, [open, promise, dir.data]);

  const submit = async () => {
    if (!title.trim()) {
      toast.error("Напишите, что нужно сделать");
      return;
    }
    if (!executorId) {
      toast.error("Выберите исполнителя");
      return;
    }
    const instr = await flow.run({
      title: title.trim(),
      executorId,
      due,
      municipalityId: municipalityId || null,
      details: details.trim() || null,
      source: promise ? "promise" : "manual",
      promiseId: promise?.id ?? null,
    });
    if (instr) onClose();
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title={promise ? "Поручение по обещанию" : "Новое поручение"}
      footer={
        <Button size="lg" block loading={flow.pending} onClick={submit} disabled={!title.trim() || !executorId || !due}>
          Поручить
        </Button>
      }
    >
      <div className="space-y-5 pt-1">
        {promise && (
          <figure className="surface p-4">
            <Quote className="h-5 w-5 text-ink-3" aria-hidden />
            <blockquote className="mt-1 text-callout font-semibold">«{promise.text}»</blockquote>
            <figcaption className="mt-1 text-subhead text-ink-2">
              {promise.occasion}, {fmtDay(promise.said_on, today)}
              {promise.due_date ? ` · обещанный срок ${fmtDay(promise.due_date, today)}` : ""}
            </figcaption>
          </figure>
        )}
        <FormGroup>
          <FieldStack label="Что сделать" htmlFor="ni-title">
            <TextArea
              id="ni-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              rows={3}
              placeholder="Коротко, с результатом: что и к какому сроку"
              autoFocus={!promise}
            />
          </FieldStack>
          <FieldRow label="Исполнитель" htmlFor="ni-exec">
            <ExecutorSelect id="ni-exec" value={executorId} onChange={setExecutorId} />
          </FieldRow>
          <FieldRow label="Срок" htmlFor="ni-due">
            <DateInput id="ni-due" value={due} min={today} onChange={(e) => setDue(e.target.value)} />
          </FieldRow>
          <FieldRow label="Где" htmlFor="ni-mun">
            <MunicipalitySelect id="ni-mun" value={municipalityId} onChange={setMunicipalityId} />
          </FieldRow>
        </FormGroup>
        <FormGroup title="Подробности">
          <FieldStack label="Для исполнителя" htmlFor="ni-details">
            <TextArea
              id="ni-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              placeholder="Необязательно"
            />
          </FieldStack>
        </FormGroup>
      </div>
    </Sheet>
  );
}
