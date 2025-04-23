import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import CardsAcaoDiariaContas from "@/components/AcaoDiariaContas";

const DetalhesAberturaConta: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* 1) Grid principal com cards */}
      <div className="grid gap-4 grid-cols-1">
        {/* Card de ação diária (seu componente já pronto) */}
        <CardsAcaoDiariaContas />
      </div>

    </div>
  );
};

export default DetalhesAberturaConta;
