import React from 'react';
import { SubtotalConfig } from '../types/budget';
import { TableRow, TableCell } from './ui/table';
import { Button } from './ui/button';
import { Eye, EyeOff, Trash } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubtotalRowProps {
  subtotal: SubtotalConfig;
  months: string[];
  calculateValue: (month?: string) => number;
  totalValue: number;
  onToggleVisibility: () => void;
  onDelete: () => void;
}

export const SubtotalRow: React.FC<SubtotalRowProps> = ({
  subtotal,
  months,
  calculateValue,
  totalValue,
  onToggleVisibility,
  onDelete
}) => {
  return (
    <TableRow className="bg-gray-50 font-medium">
      <TableCell className="p-2">
        <div className="flex items-center">
          <span className="font-semibold">SUBTOTAL: {subtotal.name}</span>
        </div>
      </TableCell>
      
      {/* Monthly values - can be positive or negative */}
      {months.map(month => (
        <TableCell 
          key={month} 
          className={cn(
            "p-2 text-right", 
            calculateValue(month) < 0 ? "text-red-700" : "text-green-700"
          )}
        >
          {calculateValue(month).toLocaleString('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
          })}
        </TableCell>
      ))}
      
      {/* Total - can be positive or negative */}
      <TableCell 
        className={cn(
          "p-2 text-right",
          totalValue < 0 ? "text-red-700" : "text-green-700"
        )}
      >
        {totalValue.toLocaleString('pt-BR', { 
          style: 'currency', 
          currency: 'BRL' 
        })}
      </TableCell>
      
      {/* Actions */}
      <TableCell className="p-1">
        <div className="flex items-center space-x-1">
          <Button 
            size="icon" 
            variant="ghost"
            onClick={onToggleVisibility}
            title="Ocultar subtotal"
            className="h-7 w-7"
          >
            <Eye size={16} />
          </Button>
          
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={onDelete}
            title="Remover subtotal"
            className="h-7 w-7 text-red-500 hover:text-red-700"
          >
            <Trash size={16} />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};
