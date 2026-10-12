import { useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

const SHEETS = ["signal", "instruction", "ask", "trust", "new", "executor"] as const;
export type SheetName = (typeof SHEETS)[number];

/**
 * Открытая карточка хранится в адресе (?signal=…), поэтому кнопка «Назад» её закрывает,
 * а ссылку можно открыть заново. Одновременно открыта одна карточка.
 */
export function useSheets() {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const get = useCallback((name: SheetName) => params.get(name), [params]);

  const open = useCallback(
    (name: SheetName, value = "1", opts: { replace?: boolean; path?: string } = {}) => {
      const next = new URLSearchParams(params);
      SHEETS.forEach((s) => next.delete(s));
      next.set(name, value);
      navigate(
        { pathname: opts.path ?? location.pathname, search: `?${next.toString()}` },
        {
          replace: opts.replace ?? false,
          // Глубина стопки карточек: «Закрыть» возвращает к предыдущей карточке или к экрану.
          state: {
            sheetDepth: ((location.state as { sheetDepth?: number } | null)?.sheetDepth ?? 0) + (opts.replace ? 0 : 1),
          },
        },
      );
    },
    [params, location.pathname, location.state, navigate],
  );

  const close = useCallback(() => {
    const depth = (location.state as { sheetDepth?: number } | null)?.sheetDepth ?? 0;
    if (depth > 0) {
      // Возвращаемся на шаг: если карточку открыли из другой карточки, снова покажется она.
      navigate(-1);
      return;
    }
    const next = new URLSearchParams(params);
    SHEETS.forEach((s) => next.delete(s));
    const search = next.toString();
    navigate({ pathname: location.pathname, search: search ? `?${search}` : "" }, { replace: true });
  }, [params, location.pathname, location.state, navigate]);

  return { get, open, close };
}
