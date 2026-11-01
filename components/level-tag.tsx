import { levelName } from "@/lib/scheduler";

export function LevelTag({ level }: { level: number }) {
  return <span className={`tag tag-level-${level}`}><span className="mono">L{level}</span>&nbsp; {levelName(level)}</span>;
}
