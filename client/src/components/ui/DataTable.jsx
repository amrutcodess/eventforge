import React from 'react';

export const DataTable = ({
  columns,
  data,
  emptyMessage = 'No records found'
}) => {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-100 bg-white">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {columns.map((col, idx) => (
              <th key={idx} className={`px-5 py-3.5 ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {data && data.length > 0 ? (
            data.map((row, rIdx) => (
              <tr key={row._id || rIdx} className="hover:bg-forge-accentLight/30 transition-colors">
                {columns.map((col, cIdx) => (
                  <td key={cIdx} className={`px-5 py-4 ${col.className || ''}`}>
                    {col.accessor ? col.accessor(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-5 py-8 text-center text-slate-400 font-medium">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
