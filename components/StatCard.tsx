import Image from "next/image";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: string;
  iconAlt: string;
  className?: string;
}

const StatCard = ({ label, value, icon, iconAlt, className }: StatCardProps) => {
  return (
    <div className={cn("stat-card", className)}>
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
          <Image src={icon} alt={iconAlt} width={20} height={20} />
        </div>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
};

export default StatCard;
