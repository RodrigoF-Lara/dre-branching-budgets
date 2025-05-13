
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { BudgetItem as BudgetItemType } from '../types/budget';
import { ScrollArea } from './ui/scroll-area';

interface AddSubtotalDialogProps {
  budget: BudgetItemType[];
  onAddSubtotal: (name: string, accountIds: string[]) => void;
  onClose: () => void;
}

export const AddSubtotalDialog: React.FC<AddSubtotalDialogProps> = ({
  budget,
  onAddSubtotal,
  onClose
}) => {
  const [name, setName] = useState('');
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  
  // Flatten the budget hierarchy for checkbox selection
  const flattenBudget = (items: BudgetItemType[], result: BudgetItemType[] = []): BudgetItemType[] => {
    items.forEach(item => {
      result.push(item);
      if (item.children.length > 0) {
        flattenBudget(item.children, result);
      }
    });
    return result;
  };
  
  const allAccounts = flattenBudget(budget);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && selectedAccounts.length > 0) {
      onAddSubtotal(name.trim(), selectedAccounts);
      onClose();
    }
  };
  
  const toggleAccount = (accountId: string) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };
  
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar novo subtotal</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subtotalName">Nome do subtotal</Label>
            <Input
              id="subtotalName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Lucro Bruto, Resultado Operacional..."
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>Selecione as contas para este subtotal</Label>
            <ScrollArea className="h-[200px] border rounded p-2">
              <div className="space-y-2">
                {allAccounts.map(account => (
                  <div key={account.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`account-${account.id}`}
                      checked={selectedAccounts.includes(account.id)}
                      onCheckedChange={() => toggleAccount(account.id)}
                    />
                    <Label 
                      htmlFor={`account-${account.id}`}
                      className="cursor-pointer"
                    >
                      {account.code} - {account.name}
                    </Label>
                  </div>
                ))}
                
                {allAccounts.length === 0 && (
                  <p className="text-sm text-gray-500">
                    Nenhuma conta disponível. Adicione contas primeiro.
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!name.trim() || selectedAccounts.length === 0}
            >
              Adicionar subtotal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
