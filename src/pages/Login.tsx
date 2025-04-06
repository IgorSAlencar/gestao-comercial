
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { User, Lock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulando autenticação (em uma aplicação real, isso seria feito com um backend)
    setTimeout(() => {
      // Usuários de demonstração
      const users = [
        { id: "1", name: "João Silva", email: "joao@bradesco.com.br", role: "supervisor" },
        { id: "2", name: "Maria Santos", email: "maria@bradesco.com.br", role: "gerente" },
      ];

      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (user && password === "123456") {
        // Login bem-sucedido
        localStorage.setItem("user", JSON.stringify(user));
        toast({
          title: "Login realizado com sucesso",
          description: `Bem-vindo(a), ${user.name}!`,
        });
        navigate("/agenda");
      } else {
        // Falha no login
        toast({
          title: "Falha no login",
          description: "Email ou senha incorretos. Tente novamente.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 1000);
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
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu.email@bradesco.com.br"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
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
              <p>Usuário de demonstração:</p>
              <p>Email: joao@bradesco.com.br</p>
              <p>Senha: 123456</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
