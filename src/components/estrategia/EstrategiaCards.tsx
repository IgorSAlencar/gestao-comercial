
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

interface EstrategiaCardProps {
  titulo: string;
  valor: string | number;
  subtexto?: string;
  color?: string;
}

export const EstrategiaCard: React.FC<EstrategiaCardProps> = ({ 
  titulo, 
  valor, 
  subtexto, 
  color = "bg-bradesco-blue" 
}) => {
  return (
    <Card className="border-none shadow-md">
      <CardContent className="p-6">
        <div className={`w-full p-1 mb-2 ${color} rounded-sm`} />
        <h3 className="text-lg font-medium text-gray-700">{titulo}</h3>
        <p className="text-3xl font-bold my-2">{valor}</p>
        {subtexto && <p className="text-sm text-gray-500">{subtexto}</p>}
      </CardContent>
    </Card>
  );
};

interface EstrategiaCardsProps {
  dados: {
    titulo: string;
    valor: string | number;
    subtexto?: string;
    color?: string;
  }[];
}

export const EstrategiaCards: React.FC<EstrategiaCardsProps> = ({ dados }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      {dados.map((card, index) => (
        <EstrategiaCard
          key={index}
          titulo={card.titulo}
          valor={card.valor}
          subtexto={card.subtexto}
          color={card.color}
        />
      ))}
    </div>
  );
};
