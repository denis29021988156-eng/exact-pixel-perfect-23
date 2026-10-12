import { cn } from "@/lib/utils";

const halo = "conic-gradient(from 200deg, #ff5f6d, #ffc371, #47e5bc, #4c8dff, #b062ff, #ff5f6d)";
const core = "radial-gradient(circle at 35% 28%, #4a86ff, #1e2e8f 72%)";

/**
 * Шар «Спросить»: радужный ореол и глубокий синий центр, как у Siri.
 * Кладётся внутрь кнопки с relative и размером; пока идёт запись голоса, ореол вращается.
 */
export function OrbLayers({ active }: { active?: boolean }) {
  return (
    <>
      <span
        className={cn(
          "absolute rounded-full opacity-90",
          active ? "-inset-[6px] animate-orb-spin blur-[10px]" : "-inset-[3px] blur-[6px]",
        )}
        style={{ background: halo }}
        aria-hidden
      />
      <span
        className="absolute inset-0 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
        style={{ background: core }}
        aria-hidden
      />
    </>
  );
}
