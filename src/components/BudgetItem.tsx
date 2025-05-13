
import React, { useState } from 'react';
import { BudgetItem as BudgetItemType } from '../types/budget';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Grip, Plus, Trash } from 'lucide-react';
import { useDrag, useDrop } from 'react-dnd';

interface BudgetItemProps {
  item: BudgetItemType;
  level: number;
  onAddChild: (parentId: string) => void;
  onDelete: (id: string) => void;
  onUpdateName: (id: string, name: string) => void;
  onUpdateValue: (id: string, value: number) => void;
  onToggleExpand: (id: string) => void;
  onMoveBudgetItem: (dragId: string, hoverId: string) => void;
}

export const BudgetItem: React.FC<BudgetItemProps> = ({
  item,
  level,
  onAddChild,
  onDelete,
  onUpdateName,
  onUpdateValue,
  onToggleExpand,
  onMoveBudgetItem
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nameValue, setNameValue] = useState(item.name);
  const [valueInput, setValueInput] = useState(item.value.toString());
  
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

  const handleValueBlur = () => {
    const numValue = parseFloat(valueInput);
    if (!isNaN(numValue) && numValue !== item.value) {
      onUpdateValue(item.id, numValue);
    } else {
      setValueInput(item.value.toString());
    }
  };

  const totalValue = item.value + item.children.reduce((sum, child) => {
    // Recursive function to calculate total including all descendants
    const calculateTotal = (item: BudgetItemType): number => {
      return item.value + item.children.reduce((sum, child) => sum + calculateTotal(child), 0);
    };
    
    return sum + calculateTotal(child);
  }, 0);

  return (
    <div 
      ref={drop} 
      className={cn(
        "animate-fade-in",
        isOver ? "bg-budget-light bg-opacity-20" : ""
      )}
    >
      <div 
        ref={dragPreview}
        className={cn(
          "flex items-center py-2 border-b border-gray-200 transition-all",
          isDragging ? "opacity-50" : "",
          isOver ? "bg-budget-light bg-opacity-20" : ""
        )}
        style={{ marginLeft: `${indentation}px` }}
      >
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
        
        <div className="font-medium text-gray-700 mr-2 min-w-[80px]">
          {item.code}
        </div>
        
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
            className="mr-auto cursor-pointer hover:text-budget"
          >
            {item.name}
          </div>
        )}
        
        <div className="flex items-center ml-4 space-x-2">
          <Input
            type="number"
            value={valueInput}
            onChange={(e) => setValueInput(e.target.value)}
            onBlur={handleValueBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleValueBlur()}
            className="w-28 text-right"
          />
          
          {hasChildren && (
            <div className="text-gray-500 w-28 text-right">
              Total: {totalValue.toLocaleString('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
              })}
            </div>
          )}
          
          <Button 
            size="icon" 
            variant="ghost"
            onClick={() => onAddChild(item.id)}
          >
            <Plus size={16} />
          </Button>
          
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => onDelete(item.id)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash size={16} />
          </Button>
        </div>
      </div>
      
      {item.isExpanded && item.children.map((child) => (
        <BudgetItem
          key={child.id}
          item={child}
          level={level + 1}
          onAddChild={onAddChild}
          onDelete={onDelete}
          onUpdateName={onUpdateName}
          onUpdateValue={onUpdateValue}
          onToggleExpand={onToggleExpand}
          onMoveBudgetItem={onMoveBudgetItem}
        />
      ))}
    </div>
  );
};
