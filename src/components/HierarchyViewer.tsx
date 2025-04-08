
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User as UserIcon, ChevronRight, ChevronDown, UserPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const HierarchyViewer: React.FC = () => {
  const { user, subordinates, loadingSubordinates, superior, loadingSuperior, refreshSubordinates } = useAuth();
  const [expanded, setExpanded] = useState(true);

  if (!user) return null;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Hierarquia</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-8 w-8 p-0"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent>
          {/* Superior section */}
          {user.role === "supervisor" && (
            <div className="mb-4">
              <h3 className="text-sm text-gray-500 mb-2">Coordenador Responsável</h3>
              {loadingSuperior ? (
                <div className="h-10 bg-gray-100 animate-pulse rounded-md"></div>
              ) : superior ? (
                <div className="flex items-center gap-2 p-2 border rounded-md">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{superior.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{superior.role}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Não há coordenador atribuído.</p>
              )}
            </div>
          )}

          {/* Current user */}
          <div className="mb-4">
            <h3 className="text-sm text-gray-500 mb-2">Você</h3>
            <div className="flex items-center gap-2 p-2 border rounded-md bg-blue-50">
              <div className="h-8 w-8 rounded-full bg-bradesco-blue flex items-center justify-center">
                <UserIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-sm">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
            </div>
          </div>

          {/* Subordinates section */}
          {(user.role === "coordenador" || user.role === "gerente") && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm text-gray-500">
                  {user.role === "coordenador" ? "Supervisores Subordinados" : "Equipe Subordinada"}
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={refreshSubordinates} 
                  className="h-7 text-xs"
                  disabled={loadingSubordinates}
                >
                  Atualizar
                </Button>
              </div>

              {loadingSubordinates ? (
                <div className="space-y-2">
                  <div className="h-10 bg-gray-100 animate-pulse rounded-md"></div>
                  <div className="h-10 bg-gray-100 animate-pulse rounded-md"></div>
                </div>
              ) : subordinates.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {subordinates.map(subordinate => (
                    <div key={subordinate.id} className="flex items-center gap-2 p-2 border rounded-md hover:bg-gray-50">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{subordinate.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{subordinate.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center border border-dashed rounded-md">
                  <UserPlus className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Nenhum subordinado encontrado</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default HierarchyViewer;
