// components/Table.tsx
import React from "react";
import type { Patient, Claim, User } from "@/types";

interface TableProps<T> {
  data: T[];
  columns: { key: keyof T; label: string }[];
}

const Table: React.FC<TableProps<any>> = ({ data, columns }) => {
  if (!data || data.length === 0) {
    return <div className="text-center text-gray-500">No data available</div>;
  }

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          {columns.map((column) => (
            <th
              key={column.key}
              className="p-2 border bg-gray-100 text-left"
            >
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => (
          <tr key={index}>
            {columns.map((column) => (
              <td key={column.key} className="p-2 border">
                {row[column.key as keyof typeof row]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Table;

