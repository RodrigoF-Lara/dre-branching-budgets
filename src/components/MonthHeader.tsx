
import React from 'react';
import { TableRow, TableHead } from './ui/table';

interface MonthHeaderProps {
  months: string[];
}

export const MonthHeader: React.FC<MonthHeaderProps> = ({ months }) => {
  return (
    <TableRow>
      <TableHead className="w-1/4">Conta</TableHead>
      {months.map(month => (
        <TableHead key={month} className="min-w-[100px]">
          {month}
        </TableHead>
      ))}
      <TableHead className="min-w-[120px]">Total Ano</TableHead>
      <TableHead className="w-[120px]">Ações</TableHead>
    </TableRow>
  );
};
