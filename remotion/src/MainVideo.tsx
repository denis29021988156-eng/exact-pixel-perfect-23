import React from "react";
import { AbsoluteFill, Series } from "remotion";
import { SubtitleBar } from "./components/SubtitleBar";
import { SceneLogin } from "./scenes/SceneLogin";
import { SceneDashboard } from "./scenes/SceneDashboard";
import { SceneBriefingLoading } from "./scenes/SceneBriefingLoading";
import { SceneBriefingResult } from "./scenes/SceneBriefingResult";
import { SceneOutro } from "./scenes/SceneOutro";
import { colors } from "./theme";

// Total 900 frames (30s @ 30fps)
// 0-150 login (5s)
// 150-330 dashboard tour + cursor moving to AI button (6s)
// 330-540 briefing loading (7s)
// 540-810 briefing result stream (9s)
// 810-900 outro (3s)

const cues = [
  { from: 8, to: 150, step: "Шаг 1", label: "Вход в систему" },
  { from: 150, to: 240, step: "Шаг 2", label: "Командный центр" },
  { from: 240, to: 330, step: "Шаг 3", label: "Сформировать брифинг" },
  { from: 330, to: 540, step: "Шаг 4", label: "Загрузка по департаментам" },
  { from: 540, to: 810, step: "Шаг 5", label: "Утренний брифинг" },
  { from: 810, to: 895, step: "Финал", label: "Реутов · Цифровая платформа" },
];

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      <Series>
        <Series.Sequence durationInFrames={150}><SceneLogin /></Series.Sequence>
        <Series.Sequence durationInFrames={180}><SceneDashboard withAiClick /></Series.Sequence>
        <Series.Sequence durationInFrames={210}><SceneBriefingLoading /></Series.Sequence>
        <Series.Sequence durationInFrames={270}><SceneBriefingResult /></Series.Sequence>
        <Series.Sequence durationInFrames={90}><SceneOutro /></Series.Sequence>
      </Series>
      <SubtitleBar cues={cues} />
    </AbsoluteFill>
  );
};