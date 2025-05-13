
import React, { useState } from 'react';
import { BudgetItem as BudgetItemType } from '../types/budget';
import { BudgetItem } from './BudgetItem';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from '@/components/ui/use-toast';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Plus } from 'lucide-react';

const BudgetManager: React.FC = () => {
  const [budget, setBudget] = useState<BudgetItemType[]>([]);
  const [nextId, setNextId] = useState(1);
  const [nextCode, setNextCode] = useState(1);

  const generateNewCode = (parentCode?: string): string => {
    if (parentCode) {
      // Find the highest child code for this parent
      const parentCodeWithDot = parentCode + '.';
      const childCodes = findAllChildCodes(budget, parentCodeWithDot);
      
      if (childCodes.length === 0) {
        return `${parentCode}.1`;
      }
      
      // Extract the numbers after the last dot
      const lastNumbers = childCodes.map(code => {
        const parts = code.split('.');
        return parseInt(parts[parts.length - 1]);
      });
      
      const highestNumber = Math.max(...lastNumbers);
      return `${parentCode}.${highestNumber + 1}`;
    }
    
    // Top level code
    const topLevelCodes = budget.map(item => parseInt(item.code));
    const nextTopLevelCode = topLevelCodes.length > 0 ? Math.max(...topLevelCodes) + 1 : 1;
    return nextTopLevelCode.toString();
  };

  const findAllChildCodes = (items: BudgetItemType[], startsWith: string): string[] => {
    let results: string[] = [];
    
    for (const item of items) {
      if (item.code.startsWith(startsWith)) {
        results.push(item.code);
      }
      
      if (item.children.length > 0) {
        results = [...results, ...findAllChildCodes(item.children, startsWith)];
      }
    }
    
    return results;
  };

  const addRootItem = () => {
    const newCode = generateNewCode();
    const newItem: BudgetItemType = {
      id: `item-${nextId}`,
      code: newCode,
      name: `Item ${newCode}`,
      value: 0,
      children: [],
      isExpanded: true,
    };
    
    setBudget([...budget, newItem]);
    setNextId(nextId + 1);
    toast({
      title: "Item adicionado",
      description: `Novo item "${newItem.name}" foi adicionado.`
    });
  };

  const addChildItem = (parentId: string) => {
    const newBudget = [...budget];
    
    const addChildToItem = (items: BudgetItemType[], parentId: string): boolean => {
      for (let i = 0; i < items.length; i++) {
        if (items[i].id === parentId) {
          const parentCode = items[i].code;
          const newCode = generateNewCode(parentCode);
          
          const newChild: BudgetItemType = {
            id: `item-${nextId}`,
            code: newCode,
            name: `Item ${newCode}`,
            value: 0,
            children: [],
            isExpanded: true,
          };
          
          items[i].children.push(newChild);
          items[i].isExpanded = true; // Expand parent to show new child
          
          setNextId(nextId + 1);
          toast({
            title: "Subitem adicionado",
            description: `Novo subitem "${newChild.name}" foi adicionado.`
          });
          
          return true;
        }
        
        if (items[i].children.length > 0) {
          const added = addChildToItem(items[i].children, parentId);
          if (added) return true;
        }
      }
      
      return false;
    };
    
    addChildToItem(newBudget, parentId);
    setBudget(newBudget);
  };

  const deleteItem = (itemId: string) => {
    const newBudget = [...budget];
    
    const deleteFromItems = (items: BudgetItemType[], itemId: string): BudgetItemType[] => {
      return items.filter(item => {
        if (item.id === itemId) {
          toast({
            title: "Item removido",
            description: `"${item.name}" foi removido do orçamento.`
          });
          return false;
        }
        
        if (item.children.length > 0) {
          item.children = deleteFromItems(item.children, itemId);
        }
        
        return true;
      });
    };
    
    setBudget(deleteFromItems(newBudget, itemId));
  };

  const updateItemName = (itemId: string, newName: string) => {
    const newBudget = [...budget];
    
    const updateNameInItems = (items: BudgetItemType[], itemId: string, newName: string): boolean => {
      for (let i = 0; i < items.length; i++) {
        if (items[i].id === itemId) {
          items[i].name = newName;
          return true;
        }
        
        if (items[i].children.length > 0) {
          const updated = updateNameInItems(items[i].children, itemId, newName);
          if (updated) return true;
        }
      }
      
      return false;
    };
    
    updateNameInItems(newBudget, itemId, newName);
    setBudget(newBudget);
  };

  const updateItemValue = (itemId: string, newValue: number) => {
    const newBudget = [...budget];
    
    const updateValueInItems = (items: BudgetItemType[], itemId: string, newValue: number): boolean => {
      for (let i = 0; i < items.length; i++) {
        if (items[i].id === itemId) {
          items[i].value = newValue;
          return true;
        }
        
        if (items[i].children.length > 0) {
          const updated = updateValueInItems(items[i].children, itemId, newValue);
          if (updated) return true;
        }
      }
      
      return false;
    };
    
    updateValueInItems(newBudget, itemId, newValue);
    setBudget(newBudget);
  };

  const toggleExpandItem = (itemId: string) => {
    const newBudget = [...budget];
    
    const toggleInItems = (items: BudgetItemType[], itemId: string): boolean => {
      for (let i = 0; i < items.length; i++) {
        if (items[i].id === itemId) {
          items[i].isExpanded = !items[i].isExpanded;
          return true;
        }
        
        if (items[i].children.length > 0) {
          const toggled = toggleInItems(items[i].children, itemId);
          if (toggled) return true;
        }
      }
      
      return false;
    };
    
    toggleInItems(newBudget, itemId);
    setBudget(newBudget);
  };

  // Function to find an item and its parent in the budget hierarchy
  const findItemAndParent = (
    items: BudgetItemType[],
    itemId: string,
    parent: BudgetItemType | null = null
  ): { item: BudgetItemType | null; parent: BudgetItemType | null } => {
    for (const item of items) {
      if (item.id === itemId) {
        return { item, parent };
      }

      if (item.children.length > 0) {
        const result = findItemAndParent(item.children, itemId, item);
        if (result.item) {
          return result;
        }
      }
    }

    return { item: null, parent: null };
  };

  // Function to move a budget item (drag and drop)
  const moveBudgetItem = (draggedItemId: string, targetItemId: string) => {
    // Prevent moving an item to itself
    if (draggedItemId === targetItemId) {
      return;
    }

    const newBudget = [...budget];
    
    // Find the dragged item and its parent
    const { item: draggedItem, parent: draggedParent } = findItemAndParent(newBudget, draggedItemId);
    
    // Find the target item where we'll add the dragged item as a child
    const { item: targetItem } = findItemAndParent(newBudget, targetItemId);
    
    if (!draggedItem || !targetItem) {
      return;
    }
    
    // Check if target is a descendant of dragged item (to prevent circular references)
    const isDescendant = (parent: BudgetItemType, potentialChild: BudgetItemType): boolean => {
      if (parent.id === potentialChild.id) {
        return true;
      }
      
      for (const child of parent.children) {
        if (isDescendant(child, potentialChild)) {
          return true;
        }
      }
      
      return false;
    };
    
    if (isDescendant(draggedItem, targetItem)) {
      toast({
        title: "Operação inválida",
        description: "Não é possível mover um item para um de seus descendentes.",
        variant: "destructive"
      });
      return;
    }
    
    // Remove the dragged item from its parent
    if (draggedParent) {
      draggedParent.children = draggedParent.children.filter(
        item => item.id !== draggedItemId
      );
    } else {
      // Item is at the root level
      setBudget(prevBudget => prevBudget.filter(item => item.id !== draggedItemId));
    }
    
    // Update code for the moved item and its children
    const updateItemCode = (item: BudgetItemType, newParentCode?: string): BudgetItemType => {
      const newCode = generateNewCode(newParentCode);
      const updatedItem: BudgetItemType = {
        ...item,
        code: newCode,
        children: item.children.map(child => updateItemCode(child, newCode))
      };
      
      return updatedItem;
    };
    
    const updatedDraggedItem = updateItemCode(draggedItem, targetItem.code);
    
    // Add the dragged item to the target's children
    targetItem.children.push(updatedDraggedItem);
    targetItem.isExpanded = true; // Expand to show the newly added item
    
    toast({
      title: "Item movido",
      description: `"${draggedItem.name}" foi movido para "${targetItem.name}".`
    });
    
    setBudget([...newBudget]);
  };

  // Calculate total budget
  const totalBudget = budget.reduce((sum, item) => {
    const calculateTotal = (item: BudgetItemType): number => {
      return item.value + item.children.reduce((sum, child) => sum + calculateTotal(child), 0);
    };
    
    return sum + calculateTotal(item);
  }, 0);

  return (
    <DndProvider backend={HTML5Backend}>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gerenciador de Orçamento DRE</CardTitle>
          <Button onClick={addRootItem} className="bg-budget hover:bg-budget-hover">
            <Plus size={16} className="mr-2" />
            Adicionar Conta Principal
          </Button>
        </CardHeader>
        
        <CardContent>
          <div className="mb-4 flex justify-between items-center p-2 bg-gray-50 rounded">
            <div className="font-semibold">Estrutura do DRE</div>
            <div className="text-xl font-bold">
              Total: {totalBudget.toLocaleString('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
              })}
            </div>
          </div>
          
          <div className="budget-list">
            {budget.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Clique no botão "Adicionar Conta Principal" para começar seu orçamento
              </div>
            ) : (
              budget.map((item) => (
                <BudgetItem
                  key={item.id}
                  item={item}
                  level={0}
                  onAddChild={addChildItem}
                  onDelete={deleteItem}
                  onUpdateName={updateItemName}
                  onUpdateValue={updateItemValue}
                  onToggleExpand={toggleExpandItem}
                  onMoveBudgetItem={moveBudgetItem}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </DndProvider>
  );
};

export default BudgetManager;
