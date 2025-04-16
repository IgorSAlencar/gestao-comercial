import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User as UserIcon, ChevronRight, ChevronDown, UserPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const HierarchyViewer: React.FC = () => {
  const { user, subordinates, loadingSubordinates, superior, loadingSuperior, refreshSubordinates } = useAuth();
  const [expanded, setExpanded] = useState(true);

  // Fix: Compare with the correct role types
  if (!user || (user.role !== "gerente" && user.role !== "coordenador" && user.role !== "supervisor")) return null;

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
          {/* Fix: Changed supervisor role check to use correct comparison */}
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
          {subordinates && subordinates.length > 0 && (
            <div>
              <h3 className="text-sm text-gray-500 mb-2">Subordinados</h3>
              <div className="space-y-2">
                {subordinates.map((subordinate) => (
                  <div key={subordinate.id} className="flex items-center gap-2 p-2 border rounded-md">
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{subordinate.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{subordinate.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default HierarchyViewer;
