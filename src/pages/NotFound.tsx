import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="surface w-full max-w-md px-6 py-10 text-center">
        <Compass className="mx-auto h-8 w-8 text-ink-3" aria-hidden />
        <h1 className="mt-3 text-title2">Страница не найдена</h1>
        <p className="mt-2 text-subhead text-ink-2">Возможно, ссылка устарела.</p>
        <Link
          to="/"
          className="press mt-6 inline-flex min-h-[44px] items-center rounded-[12px] bg-tint/12 px-4 font-semibold text-tint"
        >
          На главную
        </Link>
      </div>
    </div>
  );
}
