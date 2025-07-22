import React from "react"
import { cn } from "@/lib/utils"
import { AlertCircle, ChevronUp, ChevronDown } from "lucide-react"
import { Button } from "./button"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="w-full">
    <table
      ref={ref}
      className={cn("w-full table-fixed caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  onSort?: () => void;
  sortField?: string;
  currentSortField?: string;
  sortOrder?: 'asc' | 'desc';
}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, children, onSort, sortField, currentSortField, sortOrder, ...props }, ref) => {
    const getSortIcon = () => {
      if (sortField !== currentSortField) return null;
      return sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
    };

    return (
      <th
        ref={ref}
        className={cn(
          "h-12 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
          onSort ? "p-0 cursor-pointer hover:bg-gray-100" : "px-4",
          className
        )}
        onClick={onSort}
        {...props}
      >
        {onSort ? (
          <div className="flex items-center gap-1 px-4 py-3 h-full w-full">
            {children}
            {getSortIcon()}
          </div>
        ) : (
          children
        )}
      </th>
    )
  }
)
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

// Componente de status para a tabela
interface TableStatusProps {
  status: string;
  label?: string;
}

const TableStatus = ({ status, label }: TableStatusProps) => {
  const statusConfig = {
    pendente: {
      color: 'bg-red-100 text-red-800',
      text: 'Encerrando'
    },
    realizar: {
      color: 'bg-blue-100 text-blue-800',
      text: 'A Realizar'
    },
    tratada: {
      color: 'bg-green-100 text-green-800',
      text: 'Tratada'
    },
    bloqueada: {
      color: 'bg-gray-100 text-gray-800',
      text: 'Bloqueada'
    }
  };

  const config = statusConfig[status];

  return (
    <div className={cn(
      "flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap min-w-[100px]",
      config.color
    )}>
      {label || config.text}
    </div>
  );
};

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
  TableStatus,
}
