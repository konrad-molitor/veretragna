import React, { ReactNode } from 'react';

// Props for the AdminPanelContent component
type AdminPanelContentProps = {
  children: ReactNode;
};

export function AdminPanelContent({ children }: AdminPanelContentProps) {
  return (
    <div className="flex-1 p-6 bg-white rounded-lg overflow-y-auto">
      {children}
    </div>
  );
}

export default AdminPanelContent;
