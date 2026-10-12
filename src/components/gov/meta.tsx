import { Badge } from "@/components/ios/Badge";
import { channelLabel, severityLabel } from "@/lib/format";
import type { AgendaChannel, Severity } from "@/lib/types";
import { cn } from "@/lib/utils";
import { channelMeta, severityTone } from "./tones";

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  return (
    <Badge tone={severityTone[severity]} className={className}>
      {severityLabel[severity]}
    </Badge>
  );
}

export function ChannelIcon({ channel, className }: { channel: AgendaChannel; className?: string }) {
  const m = channelMeta[channel];
  return (
    <span
      className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]", m.bg, m.fg, className)}
      aria-hidden
    >
      <m.icon className="h-[18px] w-[18px]" />
    </span>
  );
}

export function ChannelBadge({ channel }: { channel: AgendaChannel }) {
  return <Badge tone={channelMeta[channel].tone}>{channelLabel[channel]}</Badge>;
}
