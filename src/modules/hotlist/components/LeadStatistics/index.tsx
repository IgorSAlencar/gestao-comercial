import React from 'react';
import { Users, ChartBar, CheckCheck, AlertCircle } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface StatisticCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  actionLabel: string;
  onAction: () => void;
}

function StatisticCard({ title, value, icon, actionLabel, onAction }: StatisticCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-3xl font-bold">{value}</div>
          {icon}
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}

interface LeadStatisticsProps {
  total: number;
  prospectados: number;
  tratados: number;
  semTratativas: number;
  onViewAll: () => void;
  onViewProspectados: () => void;
  onViewTratados: () => void;
  onViewSemTratativas: () => void;
}

export function LeadStatistics({
  total,
  prospectados,
  tratados,
  semTratativas,
  onViewAll,
  onViewProspectados,
  onViewTratados,
  onViewSemTratativas,
}: LeadStatisticsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatisticCard
        title="Total de Prospects"
        value={total}
        icon={<Users className="h-10 w-10 text-muted-foreground" />}
        actionLabel="Ver Todos"
        onAction={onViewAll}
      />

      <StatisticCard
        title="Já Prospectados"
        value={prospectados}
        icon={<ChartBar className="h-10 w-10 text-muted-foreground" />}
        actionLabel="Ver Prospectados"
        onAction={onViewProspectados}
      />

      <StatisticCard
        title="Tratados"
        value={tratados}
        icon={<CheckCheck className="h-10 w-10 text-muted-foreground" />}
        actionLabel="Ver Tratados"
        onAction={onViewTratados}
      />

      <StatisticCard
        title="Sem Tratativas"
        value={semTratativas}
        icon={<AlertCircle className="h-10 w-10 text-muted-foreground" />}
        actionLabel="Ver Pendentes"
        onAction={onViewSemTratativas}
      />
    </div>
  );
} 