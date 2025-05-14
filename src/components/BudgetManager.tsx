
import React, { useState, useEffect } from 'react';
import { BudgetItem as BudgetItemType, SubtotalConfig, MonthlyValues } from '../types/budget';
import { BudgetItem } from './BudgetItem';
import { SubtotalRow } from './SubtotalRow';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from '@/components/ui/use-toast';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Plus, Combine } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableBody } from './ui/table';
import { MonthHeader } from './MonthHeader';
import { AddSubtotalDialog } from './AddSubtotalDialog';

const months = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

const BudgetManager: React.FC = () => {
  const [budget, setBudget] = useState<BudgetItemType[]>([]);
  const [nextId, setNextId] = useState(1);
  const [nextCode, setNextCode] = useState(1);
  const [subtotals, setSubtotals] = useState<SubtotalConfig[]>([]);
  const [showSubtotalDialog, setShowSubtotalDialog] = useState(false);

  // Initialize empty monthly values
  const initializeMonthlyValues = (): MonthlyValues => {
    const values: MonthlyValues = { total: 0 };
    months.forEach(month => {
      values[month] = 0;
    });
    return values;
  };

  // Recalculate parent item values when children change
  useEffect(() => {
    // Skip calculation if no items exist
    if (budget.length === 0) return;

    // Create a deep copy to avoid reference issues
    const updatedBudget = JSON.parse(JSON.stringify(budget)) as BudgetItemType[];
    
    // Function to calculate parent values based on children
    const calculateParentValues = (items: BudgetItemType[]): void => {
      for (const item of items) {
        if (item.children.length > 0) {
          // First, recursively update child values
          calculateParentValues(item.children);
          
          // Initialize parent values with zeros
          const newValues: MonthlyValues = { total: 0 };
          months.forEach(month => {
            newValues[month] = 0;
          });
          
          // Sum up values from children
          item.children.forEach(child => {
            months.forEach(month => {
              const childValue = child.values[month] || 0;
              
              // Apply sign based on child type - revenue adds, expense subtracts
              if (child.type === "expense") {
                // Expenses subtract from total
                newValues[month] = (newValues[month] || 0) - childValue;
              } else {
                // Revenue adds to total
                newValues[month] = (newValues[month] || 0) + childValue;
              }
            });
          });
          
          // Calculate the total
          let total = 0;
          months.forEach(month => {
            total += newValues[month] || 0;
          });
          newValues.total = total;
          
          // Update parent values
          item.values = newValues;
        }
      }
    };
    
    calculateParentValues(updatedBudget);
    setBudget(updatedBudget);
  }, [budget]); // This will run whenever budget changes

  const generateNewCode = (parentCode?: string): string => {
    // ... keep existing code (função de geração de códigos)
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
    // ... keep existing code (função auxiliar para códigos)
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

  const addRootItem = (isNegative: boolean = false) => {
    const newCode = generateNewCode();
    const newItem: BudgetItemType = {
      id: `item-${nextId}`,
      code: newCode,
      name: `Item ${newCode}`,
      values: initializeMonthlyValues(),
      children: [],
      isExpanded: true,
      isNegative: isNegative,
      type: isNegative ? "expense" : "revenue"
    };
    
    setBudget([...budget, newItem]);
    setNextId(nextId + 1);
    toast({
      title: isNegative ? "Despesa adicionada" : "Receita adicionada",
      description: `Novo item "${newItem.name}" foi adicionado.`
    });
  };

  const addChildItem = (parentId: string, isNegative: boolean = false) => {
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
            values: initializeMonthlyValues(),
            children: [],
            isExpanded: true,
            isNegative: isNegative,
            type: isNegative ? "expense" : "revenue"
          };
          
          items[i].children.push(newChild);
          items[i].isExpanded = true; // Expand parent to show new child
          
          setNextId(nextId + 1);
          toast({
            title: isNegative ? "Despesa adicionada" : "Receita adicionada",
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
          
          // Also remove from any subtotals
          setSubtotals(prevSubtotals => prevSubtotals.map(st => ({
            ...st,
            accountIds: st.accountIds.filter(id => id !== itemId)
          })));
          
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

  const updateItemMonthlyValue = (itemId: string, month: string, newValue: number) => {
    const newBudget = [...budget];
    
    const updateValueInItems = (items: BudgetItemType[], itemId: string, month: string, newValue: number): boolean => {
      for (let i = 0; i < items.length; i++) {
        if (items[i].id === itemId) {
          // Ensure positive value only
          const positiveValue = Math.abs(newValue);
          
          // Update the specific month
          items[i].values[month] = positiveValue;
          
          // Recalculate the total for this item
          let total = 0;
          months.forEach(m => {
            total += items[i].values[m] || 0;
          });
          items[i].values.total = total;
          
          return true;
        }
        
        if (items[i].children.length > 0) {
          const updated = updateValueInItems(items[i].children, itemId, month, newValue);
          if (updated) return true;
        }
      }
      
      return false;
    };
    
    updateValueInItems(newBudget, itemId, month, newValue);
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

  const toggleItemNegative = (itemId: string) => {
    const newBudget = [...budget];
    
    const toggleNegativeInItems = (items: BudgetItemType[], itemId: string): boolean => {
      for (let i = 0; i < items.length; i++) {
        if (items[i].id === itemId) {
          items[i].isNegative = !items[i].isNegative;
          // Atualiza o tipo também
          items[i].type = items[i].isNegative ? "expense" : "revenue";
          return true;
        }
        
        if (items[i].children.length > 0) {
          const toggled = toggleNegativeInItems(items[i].children, itemId);
          if (toggled) return true;
        }
      }
      
      return false;
    };
    
    toggleNegativeInItems(newBudget, itemId);
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

  // Function to find a budget item by ID
  const findItemById = (itemId: string, items: BudgetItemType[] = budget): BudgetItemType | null => {
    for (const item of items) {
      if (item.id === itemId) {
        return item;
      }
      
      if (item.children.length > 0) {
        const foundItem = findItemById(itemId, item.children);
        if (foundItem) return foundItem;
      }
    }
    
    return null;
  };

  // Function to add a new subtotal configuration
  const addSubtotal = (name: string, accountIds: string[]) => {
    const newSubtotal: SubtotalConfig = {
      id: `subtotal-${Date.now()}`,
      name,
      accountIds,
      isVisible: true
    };
    
    setSubtotals([...subtotals, newSubtotal]);
    toast({
      title: "Subtotal criado",
      description: `O subtotal "${name}" foi adicionado ao orçamento.`
    });
  };

  // Function to toggle subtotal visibility
  const toggleSubtotalVisibility = (subtotalId: string) => {
    setSubtotals(prevSubtotals => 
      prevSubtotals.map(st => 
        st.id === subtotalId ? { ...st, isVisible: !st.isVisible } : st
      )
    );
  };

  // Function to delete a subtotal
  const deleteSubtotal = (subtotalId: string) => {
    setSubtotals(prevSubtotals => prevSubtotals.filter(st => st.id !== subtotalId));
    toast({
      title: "Subtotal removido",
      description: `O subtotal foi removido do orçamento.`
    });
  };

  // Calculate subtotal value
  const calculateSubtotal = (subtotal: SubtotalConfig, month?: string): number => {
    return subtotal.accountIds.reduce((sum, accountId) => {
      const item = findItemById(accountId);
      if (!item) return sum;
      
      // Pegar o valor absoluto
      const value = month ? item.values[month] || 0 : (item.values.total || 0);
      
      // Aplicar o sinal baseado no tipo (receita ou despesa)
      return sum + (item.isNegative ? -value : value);
    }, 0);
  };

  // Calculate total budget for all months
  const calculateBudgetTotals = () => {
    const totals: MonthlyValues = { total: 0 };
    
    // Initialize with zeros
    months.forEach(month => {
      totals[month] = 0;
    });
    
    // Only include top-level items in the total
    budget.forEach(item => {
      // For each month, add the value with the appropriate sign
      months.forEach(month => {
        const monthValue = item.values[month] || 0;
        // Apply sign based on revenue/expense type
        const valueWithSign = item.isNegative ? -monthValue : monthValue;
        totals[month] = (totals[month] || 0) + valueWithSign;
      });
      
      // Calculate total for the whole year
      const itemTotalForYear = item.values.total || 0;
      
      // Apply sign to the total as well
      const totalWithSign = item.isNegative ? -itemTotalForYear : itemTotalForYear;
      totals.total = (totals.total || 0) + totalWithSign;
    });
    
    return totals;
  };

  // Get the budget totals
  const budgetTotals = calculateBudgetTotals();

  return (
    <DndProvider backend={HTML5Backend}>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gerenciador de Orçamento DRE</CardTitle>
          <div className="flex space-x-2">
            <Button 
              onClick={() => addRootItem(false)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus size={16} className="mr-2" />
              Adicionar Receita
            </Button>
            
            <Button 
              onClick={() => addRootItem(true)}
              className="bg-red-600 hover:bg-red-700"
            >
              <Plus size={16} className="mr-2" />
              Adicionar Despesa
            </Button>
            
            <Button 
              onClick={() => setShowSubtotalDialog(true)}
              variant="outline"
            >
              <Combine size={16} className="mr-2" />
              Adicionar Subtotal
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="mb-4 flex justify-between items-center p-2 bg-gray-50 rounded">
            <div className="font-semibold">Estrutura do DRE</div>
            <div className="text-xl font-bold">
              Total Anual: {budgetTotals.total?.toLocaleString('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
              })}
            </div>
          </div>
          
          <div className="budget-table-container overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <MonthHeader months={months} />
              </TableHeader>
              
              <TableBody>
                {budget.length === 0 ? (
                  <TableRow>
                    <td colSpan={months.length + 3} className="text-center py-8 text-gray-500">
                      Clique nos botões "Adicionar Receita" ou "Adicionar Despesa" para começar seu orçamento
                    </td>
                  </TableRow>
                ) : (
                  <>
                    {budget.map((item) => (
                      <BudgetItem
                        key={item.id}
                        item={item}
                        level={0}
                        months={months}
                        onAddChild={addChildItem}
                        onDelete={deleteItem}
                        onUpdateName={updateItemName}
                        onUpdateMonthlyValue={updateItemMonthlyValue}
                        onToggleExpand={toggleExpandItem}
                        onToggleNegative={toggleItemNegative}
                        onMoveBudgetItem={moveBudgetItem}
                      />
                    ))}
                    
                    {/* Render subtotal rows */}
                    {subtotals.filter(st => st.isVisible).map(subtotal => (
                      <SubtotalRow
                        key={subtotal.id}
                        subtotal={subtotal}
                        months={months}
                        calculateValue={(month) => calculateSubtotal(subtotal, month)}
                        totalValue={calculateSubtotal(subtotal)}
                        onToggleVisibility={() => toggleSubtotalVisibility(subtotal.id)}
                        onDelete={() => deleteSubtotal(subtotal.id)}
                      />
                    ))}
                    
                    {/* Total row */}
                    <TableRow className="font-bold bg-gray-100">
                      <td className="p-2">TOTAL</td>
                      {months.map(month => (
                        <td key={month} className="p-2 text-right">
                          {budgetTotals[month]?.toLocaleString('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL' 
                          })}
                        </td>
                      ))}
                      <td className="p-2 text-right">
                        {budgetTotals.total?.toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL' 
                        })}
                      </td>
                      <td className="p-2"></td>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Dialog for adding subtotals */}
      {showSubtotalDialog && (
        <AddSubtotalDialog
          budget={budget}
          onAddSubtotal={addSubtotal}
          onClose={() => setShowSubtotalDialog(false)}
        />
      )}
    </DndProvider>
  );
};

export default BudgetManager;
