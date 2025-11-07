import { useEffect, useRef, useState } from "react";
import { Users, MessageSquare, Heart, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useCountUp } from "@/hooks/useCountUp";

interface Stat {
  icon: typeof Users;
  value: number;
  label: string;
  suffix?: string;
}

const stats: Stat[] = [
  { icon: Users, value: 50000, label: "Active Users", suffix: "+" },
  { icon: MessageSquare, value: 2000000, label: "Messages Sent", suffix: "+" },
  { icon: Heart, value: 10000, label: "Matches Made", suffix: "+" },
  { icon: Star, value: 98, label: "User Satisfaction", suffix: "%" },
];

const formatNumber = (num: number, suffix?: string): string => {
  if (suffix === "%") return `${num}${suffix}`;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M${suffix || ""}`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K${suffix || ""}`;
  return `${num}${suffix || ""}`;
};

const StatCard = ({ stat, inView }: { stat: Stat; inView: boolean }) => {
  const count = useCountUp(stat.value, 2000, inView);
  const Icon = stat.icon;

  return (
    <Card className="bg-background/40 backdrop-blur-lg border-border hover:border-primary/50 transition-all p-8 text-center group card-gradient-hover">
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 rounded-full bg-gradient-primary/20 group-hover:bg-gradient-primary/30 transition-all">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <div className="text-4xl md:text-5xl font-bold text-gradient-animated">
          {formatNumber(count, stat.suffix)}
        </div>
        <div className="text-muted-foreground font-medium">{stat.label}</div>
      </div>
    </Card>
  );
};

const StatsSection = () => {
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-20 px-4 relative overflow-hidden bg-gradient-to-b from-background via-background/95 to-background"
    >
      <div className="absolute inset-0 bg-gradient-accent opacity-5" />
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Join Thousands of <span className="text-gradient-pulse">Happy Users</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Experience the future of meaningful connections powered by blockchain technology
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatCard key={index} stat={stat} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
