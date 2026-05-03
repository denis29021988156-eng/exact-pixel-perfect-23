# Аудит лендинга и план правок

Сверка проводилась против ТЗ и ориентиров (Linear.app, Vercel.com, Arc.net). Без приложенного Figma-макета истинный «пиксель-в-пиксель» недостижим, поэтому правки нацелены на устранение конкретных расхождений с ТЗ, багов Tailwind-классов и нарушений memory-правил (Inter 600–800, ритм отступов).

## Найденные расхождения

### Баги (рендерятся неправильно)
1. `bg-[#EF4444]/8` в `TabletMockup.tsx` (slide Dashboard) — opacity `/8` не входит в шкалу Tailwind, цвет не применяется. Заменить на `/10`.
2. Tablet-mockup в момент перехода виден как «пустая панель» — переход `filter: blur(8px)` + `AnimatePresence mode="wait"` даёт длинное «пустое» окно. Сократить duration до 0.35с и убрать blur у exit.
3. Заголовок Hero `font-medium` (500) при `font-sans = Inter`. По memory-правилу для headings должны быть 600–800. Сделать `font-semibold` (600) у крупных h1/h2 и `font-bold` (700) у CountUp-чисел.
4. Hero "прокрутите" индикатор: `h-12 w-px` линия с летящей точкой, но точка `bg-[#3B82F6]` шириной 4px перекрывает линию и выглядит лишней. Заменить на тонкую градиентную линию + chevron, как у Linear.
5. Section 2 metrics — `divide-x divide-white/[0.06]` рисует сплошные перегородки на mobile (где grid 2×2). Добавить `divide-y lg:divide-y-0` и сбросить дивайдеры между строками.

### Типографика
6. Hero h1: `tracking-[-0.04em]` норм, но `clamp(56px,8vw,120px)` на 1440 даёт ~115px — у Linear hero ~88–96px и `font-weight 600`. Ужать до `clamp(56px, 6.4vw, 96px)` + `font-semibold`.
7. h2 секций (`Знакомо?`, `Дисциплина...`, `8 недель...`): `clamp(44px, 5.5vw, 80px)` слишком близко к hero. Сделать `clamp(40px, 4.6vw, 72px)` для иерархии.
8. Метки секций (`01 — цифры`): сейчас `text-[11px]` `tracking-[0.25em]`. У ориентиров — `text-[12px]` + `tracking-[0.18em]`. Унифицировать как утилиту `eyebrow`.
9. CountUp числа: `font-light` + `tracking-[-0.04em]`. Linear/Vercel используют `font-semibold/bold` для KPI. Поменять на `font-bold` + `tracking-[-0.05em]`.
10. Body text: `text-[#94A3B8]` ок, но размер `text-base lg:text-lg` нестабильный — нормализовать на `text-[15px] lg:text-[17px] leading-[1.6]`.

### Отступы и ритм
11. Секции — `py-32 lg:py-44` (128/176px). По ритму Linear — 160/208 (`py-40 lg:py-52`). Привести к единому шагу.
12. Между eyebrow и h2 сейчас разнобой (`mb-10`, `mb-16`). Зафиксировать `mb-8` везде.
13. Между h2 и контентом — `mt-12`/`mt-20`/`mt-28`. Зафиксировать `mt-16 lg:mt-20`.
14. Hero grid `gap-12` слишком плотный для 1440. Сделать `gap-16 xl:gap-24`.
15. Pain-секция — рандомные `md:ml-{0,8,12,24,40}`. Это «творческий хаос», но сейчас выглядит как сломанная сетка. Сократить разброс до 0/16/32/48/24 и центровать визуальный вес.
16. Section 5 (Compare) — `space-y-3` между парами слишком тесно (24px между блоками). Поднять до `space-y-5`.
17. Footer `py-10` — поднять до `py-14` для воздуха.

### Кнопки и интерактив
18. Primary CTA: `px-7 py-4 text-sm` — мелковато для hero. Linear hero CTA ≈ `px-8 py-4 text-[15px] font-medium`. Увеличить и убрать `font-semibold` (Inter 500 для пилюли), оставив 600 только в финальном CTA.
19. Secondary link «Посмотреть план внедрения» — без подчёркивания/стрелки, теряется. Добавить `border-b border-white/10 hover:border-white/40` и постоянно видимую `→`.
20. Module cards: tilt 8° слишком сильный, ломается при наведении. Снизить до 4°.

### Бордеры/контраст
21. `border-white/[0.06]` по всем секциям сливается с фоном. Поднять до `border-white/[0.08]`.
22. Pain-карточки `border-white/[0.06]` + hover `border-[#3B82F6]/40` — скачок слишком резкий. Промежуточный `hover:border-[#3B82F6]/25`.

## План реализации

```text
1. src/pages/LandingPage.tsx — массовая замена:
   - eyebrow → единый класс
   - h1/h2 размеры и font-weight
   - py-секций, mb/mt ритм
   - hero gap, CTA размеры, secondary-link
   - pain offsets, compare space-y, footer
   - border opacity 0.06 → 0.08
2. src/components/landing/TabletMockup.tsx
   - bg-[#EF4444]/8 → /10
   - Сократить переход slides до 0.35s, exit без blur
   - Уменьшить начальный tilt до rx:6, ry:-12
3. src/components/landing/CountUp.tsx
   - font-bold + tracking-[-0.05em] (если задаётся внутри)
4. src/components/landing/ModuleCard.tsx
   - tilt множитель 8 → 4
5. После правок — снять скриншоты на 1440×900 и 390×844, проверить hero/metrics/pains/final CTA, при необходимости донастроить.
```

## Что вне плана
- Не трогаю WebGL-фон и анимации framer-motion по контракту.
- Не меняю копирайт/тексты.
- Не добавляю/удаляю секции.

После approve — выполню правки в одном проходе и пришлю скриншоты «до/после» для верификации.
