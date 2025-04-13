import React from 'react';
import { Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { LeadStatus, statusLabels } from "@/shared/types/lead";

interface FilterFormValues {
  searchTerm: string;
  status: LeadStatus | '';
  location: string;
}

interface LeadFiltersProps {
  onFiltersChange: (filters: FilterFormValues) => void;
  showClearFilters?: boolean;
}

export function LeadFilters({ onFiltersChange, showClearFilters = true }: LeadFiltersProps) {
  const form = useForm<FilterFormValues>({
    defaultValues: {
      searchTerm: "",
      status: "",
      location: "",
    }
  });

  const { watch } = form;

  React.useEffect(() => {
    const subscription = watch((value) => {
      onFiltersChange(value as FilterFormValues);
    });
    return () => subscription.unsubscribe();
  }, [watch, onFiltersChange]);

  const clearFilters = () => {
    form.reset({
      searchTerm: "",
      status: "",
      location: ""
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Filtros</span>
          {showClearFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="searchTerm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Buscar por Nome, CNPJ, Segmento, Agência ou PA</FormLabel>
                  <FormControl>
                    <div className="flex w-full items-center space-x-2">
                      <Input placeholder="Buscar..." {...field} />
                      <Button type="button" size="icon" variant="ghost">
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      {Object.entries(statusLabels).map(([value, { label }]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Localização (Município/UF)</FormLabel>
                  <FormControl>
                    <div className="flex w-full items-center space-x-2">
                      <Input placeholder="Ex: São Paulo ou SP" {...field} />
                      <Button type="button" size="icon" variant="ghost">
                        <Filter className="h-4 w-4" />
                      </Button>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </Form>
      </CardContent>
    </Card>
  );
} 