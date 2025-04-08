
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";

const LoginPage: React.FC = () => {
  const [funcional, setFuncional] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(funcional, password);
    } catch (error) {
      // Error is handled in the AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-4">
        <div className="mb-8 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bradesco-gradient flex items-center justify-center mb-4">
            <span className="font-bold text-white text-xl">BE</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Bradesco Expresso</h1>
          <p className="text-gray-600">Gestão Comercial</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Acesse sua conta</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="funcional">Funcional</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="funcional"
                    type="text"
                    placeholder="Digite seu funcional"
                    className="pl-10"
                    value={funcional}
                    onChange={(e) => setFuncional(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={toggleShowPassword}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-bradesco-blue" 
                disabled={isLoading}
              >
                {isLoading ? "Autenticando..." : "Entrar"}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-gray-500">
              <p>Usuários de demonstração:</p>
              <p>Supervisor: 12345 / senha: 123456</p>
              <p>Coordenador: 67890 / senha: 123456</p>
              <p>Gerente: 54321 / senha: 123456</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
