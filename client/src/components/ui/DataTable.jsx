import React from 'react';

export const DataTable = ({
  columns,
  data,
  emptyMessage = 'No records found'
}) => {
  return (
    <div className="w-full overflow-x-auto rounded-md border border-line bg-surface">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-line bg-canvas text-eyebrow uppercase font-medium text-ink-muted">
            {columns.map((col, idx) => (
              <th key={idx} className={`px-5 py-3.5 ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line text-sm">
          {data && data.length > 0 ? (
            data.map((row, rIdx) => (
              <tr key={row._id || rIdx} className="transition-colors hover:bg-canvas">
                {columns.map((col, cIdx) => (
                  <td key={cIdx} className={`px-5 py-4 ${col.className || ''}`}>
                    {col.accessor ? col.accessor(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="px-5 py-8 text-center font-medium text-ink-muted"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
