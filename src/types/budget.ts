
export interface BudgetItem {
  id: string;
  code: string;
  name: string;
  value: number;
  children: BudgetItem[];
  isExpanded?: boolean;
}

export interface DragItem {
  id: string;
  parentId: string | null;
  index: number;
}
