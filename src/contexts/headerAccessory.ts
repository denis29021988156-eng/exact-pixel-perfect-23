import { createContext, type ReactNode } from "react";

/** Что раскладка показывает справа от крупного заголовка экрана (кнопка профиля). */
export const HeaderAccessoryContext = createContext<ReactNode>(null);
