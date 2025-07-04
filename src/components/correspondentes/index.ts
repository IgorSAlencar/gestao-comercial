// Componentes principais
export { CorrespondentesTable } from './CorrespondentesTable';
export { CorrespondentesFilters } from './CorrespondentesFilters';
export { TratativaCorbanModal } from './TratativaCorbanModal';
export { ViewTratativasCorbanModal } from './ViewTratativasCorbanModal';

// Re-export dos tipos para conveniência
export type {
  Correspondente,
  TratativaCorban,
  FilterStateCorrespondente,
  CorrespondentesStats,
  TratativaFormData
} from '@/shared/types/correspondente';

export {
  TIPOS_CONTATO,
  OBJETIVOS_VISITA,
  STATUS_CORRESPONDENTE,
  PRODUTOS_BANCARIOS,
  RESULTADO_TRATATIVA
} from '@/shared/types/correspondente'; 