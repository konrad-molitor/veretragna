import React, { useState } from 'react';
import {
  Sidebar,
  AdminPanelContent,
  UsersPanel,
  LocationsPanel,
} from './components';

// Main admin dashboard component that manages panel navigation
export function AdminDashboard() {
  const [activePanel, setActivePanel] = useState<string>('users');

  // Function to render the active panel based on selection
  const renderPanel = () => {
    switch (activePanel) {
      case 'users':
        return <UsersPanel />;
      case 'locations':
        return <LocationsPanel />;
      default:
        return <UsersPanel />;
    }
  };

  return (
    <div className="flex bg-white rounded-lg shadow-sm" style={{ height: 'calc(100vh - 140px)' }}>
      <Sidebar activeItem={activePanel} onItemClick={setActivePanel} />
      <AdminPanelContent>{renderPanel()}</AdminPanelContent>
    </div>
  );
}

export default AdminDashboard;
