// src/hooks/useSuperTable.ts
import { ColumnDef } from '@/types/table';
import { useState, useMemo } from 'react';

export function useSuperTable<T extends { id: number | string }>(
  initialData: T[], 
  initialColumns: ColumnDef<T>[]
) {
  const [data, setData] = useState<T[]>(initialData);
  const [columns, setColumns] = useState(initialColumns);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set());

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const lowerSearch = searchTerm.toLowerCase();
    return data.filter((row) => 
      Object.values(row).some((val) => 
        String(val).toLowerCase().includes(lowerSearch)
      )
    );
  }, [data, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedData.map(row => row.id)));
    }
  };

  const toggleSelectRow = (id: number | string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const updateCell = (rowId: number | string, columnId: string, newValue: string | number | boolean | unknown) => {
    setData(prev => prev.map(row => 
      row.id === rowId ? { ...row, [columnId]: newValue } : row
    ));
  };

  const addRow = (newRow: T) => {
    setData(prev => [newRow, ...prev]);
  };

  const addColumn = (newCol: ColumnDef<T>) => {
    setColumns(prev => [...prev, newCol]);
  };

  return {
    data: paginatedData,
    columns,
    totalRecords: filteredData.length,
    currentPage,
    pageSize,
    totalPages,
    searchTerm,
    selectedIds,
    setSearchTerm,
    setCurrentPage,
    setPageSize,
    toggleSelectAll,
    toggleSelectRow,
    updateCell,
    addRow,
    addColumn
  };
}