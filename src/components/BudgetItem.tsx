
import React, { useState } from 'react';
import { BudgetItem as BudgetItemType } from '../types/budget';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Grip, Plus, Trash, ArrowDown, ArrowUp } from 'lucide-react';
import { useDrag, useDrop } from 'react-dnd';
import { TableRow, TableCell } from './ui/table';

interface BudgetItemProps {
  item: BudgetItemType;
  level: number;
  months: string[];
  onAddChild: (parentId: string, isNegative: boolean) => void;
  onDelete: (id: string) => void;
  onUpdateName: (id: string, name: string) => void;
  onUpdateMonthlyValue: (id: string, month: string, value: number) => void;
  onToggleExpand: (id: string) => void;
  onToggleNegative: (id: string) => void;
  onMoveBudgetItem: (dragId: string, hoverId: string) => void;
}

export const BudgetItem: React.FC<BudgetItemProps> = ({
  item,
  level,
  months,
  onAddChild,
  onDelete,
  onUpdateName,
  onUpdateMonthlyValue,
  onToggleExpand,
  onToggleNegative,
  onMoveBudgetItem
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nameValue, setNameValue] = useState(item.name);
  
  const hasChildren = item.children.length > 0;
  const indentation = level * 20; // 20px per level of indentation

  // Set up drag and drop
  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: 'BUDGET_ITEM',
    item: { id: item.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: 'BUDGET_ITEM',
    drop: (draggedItem: { id: string }) => {
      if (draggedItem.id !== item.id) {
        onMoveBudgetItem(draggedItem.id, item.id);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  const handleNameBlur = () => {
    setIsEditing(false);
    if (nameValue.trim() !== item.name) {
      onUpdateName(item.id, nameValue.trim());
    }
  };

  const handleValueChange = (month: string, e: React.ChangeEvent<HTMLInputElement>) => {
    // Converter para número e garantir que seja positivo
    let numValue = parseFloat(e.target.value);
    
    // Se não for um número válido ou for negativo, não atualizar
    if (isNaN(numValue) || numValue < 0) {
      return;
    }
    
    onUpdateMonthlyValue(item.id, month, numValue);
  };

  // Get the sign indicator based on isNegative flag
  const signIndicator = item.isNegative ? (
    <ArrowDown size={16} className="text-red-500" />
  ) : (
    <ArrowUp size={16} className="text-green-500" />
  );

  return (
    <>
      <TableRow 
        ref={drop} 
        className={cn(
          "animate-fade-in transition-all",
          isOver ? "bg-budget-light bg-opacity-20" : "",
          isDragging ? "opacity-50" : "",
          hasChildren ? "font-semibold" : "",
          item.isNegative ? "text-red-700" : "text-green-700"
        )}
      >
        <TableCell className="p-2">
          <div 
            className="flex items-center"
            style={{ paddingLeft: `${indentation}px` }}
          >
            {/* Adicionar botões no início da linha */}
            <div className="flex items-center space-x-1 mr-2">
              <Button 
                size="icon" 
                variant="ghost"
                onClick={() => onAddChild(item.id, false)}
                title="Adicionar receita"
                className="h-6 w-6 text-green-600 border border-green-300"
              >
                <Plus size={14} />
              </Button>
              
              <Button 
                size="icon" 
                variant="ghost"
                onClick={() => onAddChild(item.id, true)}
                title="Adicionar despesa"
                className="h-6 w-6 text-red-600 border border-red-300"
              >
                <Plus size={14} />
              </Button>
            </div>
            
            <div 
              ref={drag}
              className="cursor-move mr-2 text-gray-400 hover:text-gray-700"
            >
              <Grip size={16} />
            </div>
            
            <button 
              onClick={() => onToggleExpand(item.id)}
              className="mr-2 text-gray-500"
            >
              {hasChildren ? (
                item.isExpanded ? (
                  <ChevronDown size={18} />
                ) : (
                  <ChevronRight size={18} />
                )
              ) : (
                <div className="w-[18px]"></div>
              )}
            </button>
            
            <div className="font-medium text-gray-700 mr-2 min-w-[60px]">
              {item.code}
            </div>
            
            <button 
              onClick={() => onToggleNegative(item.id)}
              className="mr-2"
              title={item.isNegative ? "Despesa (clique para alterar)" : "Receita (clique para alterar)"}
            >
              {signIndicator}
            </button>
            
            {isEditing ? (
              <Input
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onBlur={handleNameBlur}
                onKeyDown={(e) => e.key === 'Enter' && handleNameBlur()}
                className="mr-auto"
                autoFocus
              />
            ) : (
              <div 
                onClick={() => setIsEditing(true)}
                className="cursor-pointer hover:text-budget truncate max-w-[400px]"
              >
                {item.name}
              </div>
            )}
          </div>
        </TableCell>
        
        {/* Monthly value inputs - somente editáveis se não tiver filhos */}
        {months.map(month => (
          <TableCell 
            key={month} 
            className={cn("p-1", item.isNegative ? "text-red-700" : "text-green-700")}
          >
            {hasChildren ? (
              <div className="text-right px-2">
                {(item.values[month] || 0).toLocaleString('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                })}
              </div>
            ) : (
              <Input
                type="number"
                min="0"
                value={item.values[month] || ''}
                onChange={(e) => handleValueChange(month, e)}
                className="text-right px-1 py-1 h-8"
              />
            )}
          </TableCell>
        ))}
        
        {/* Total column */}
        <TableCell 
          className={cn(
            "p-2 text-right font-medium",
            item.isNegative ? "text-red-700" : "text-green-700"
          )}
        >
          {(item.values.total || 0).toLocaleString('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
          })}
        </TableCell>
        
        {/* Actions column */}
        <TableCell className="p-1">
          <div className="flex items-center justify-end">
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => onDelete(item.id)}
              className="h-7 w-7 text-red-500 hover:text-red-700"
            >
              <Trash size={16} />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      
      {/* Render children */}
      {item.isExpanded && item.children.map((child) => (
        <BudgetItem
          key={child.id}
          item={child}
          level={level + 1}
          months={months}
          onAddChild={onAddChild}
          onDelete={onDelete}
          onUpdateName={onUpdateName}
          onUpdateMonthlyValue={onUpdateMonthlyValue}
          onToggleExpand={onToggleExpand}
          onToggleNegative={onToggleNegative}
          onMoveBudgetItem={onMoveBudgetItem}
        />
      ))}
    </>
  );
};
