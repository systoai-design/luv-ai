import { useState } from "react";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

const themes = [
  { id: "default", name: "Purple-Orange", colors: ["#a855f7", "#ff6b35"] },
  { id: "ocean", name: "Blue-Cyan", colors: ["#3b82f6", "#06b6d4"] },
  { id: "sunset", name: "Red-Pink", colors: ["#ef4444", "#ec4899"] },
  { id: "forest", name: "Green-Emerald", colors: ["#10b981", "#14b8a6"] },
] as const;

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="absolute bottom-16 right-0 flex flex-col gap-2 p-3 bg-background/95 backdrop-blur-lg border border-border rounded-lg shadow-2xl animate-scale-in">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTheme(t.id as any);
                setIsOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-md hover:bg-accent transition-all",
                theme === t.id && "bg-accent"
              )}
            >
              <div className="flex gap-1">
                {t.colors.map((color, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full border-2 border-border"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <span className="text-sm font-medium whitespace-nowrap">
                {t.name}
              </span>
              {theme === t.id && (
                <span className="text-primary ml-auto">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
      
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        className="w-14 h-14 rounded-full shadow-glow hover:scale-110 transition-transform"
        variant="gradient"
      >
        <Palette className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default ThemeToggle;
