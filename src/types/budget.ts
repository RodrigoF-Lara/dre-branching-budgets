

export interface BudgetItem {
  id: string;
  code: string;
  name: string;
  values: MonthlyValues;
  children: BudgetItem[];
  isExpanded?: boolean;
  isNegative?: boolean;  // true para despesas, false para receitas
  type: "revenue" | "expense";  // Adicionamos este campo para maior clareza
}

export interface MonthlyValues {
  [month: string]: number;
  total?: number;
}

export interface DragItem {
  id: string;
  parentId: string | null;
  index: number;
}

export interface SubtotalConfig {
  id: string;
  name: string;
  accountIds: string[];
  isVisible: boolean;
}

