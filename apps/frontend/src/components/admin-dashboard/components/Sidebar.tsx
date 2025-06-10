import React from 'react';

// Props for the Sidebar component
type SidebarProps = {
  activeItem: string;
  onItemClick: (item: string) => void;
};

export function Sidebar({ activeItem, onItemClick }: SidebarProps) {
  const navItems = [
    { id: 'users', label: 'Usuarios' },
    { id: 'locations', label: 'Ubicaciones' },
    { id: 'buses', label: 'Vehículos' },
    { id: 'routes', label: 'Rutas' },
    { id: 'schedules', label: 'Horarios' },
    { id: 'trips', label: 'Viajes' },
    { id: 'custom-trips', label: 'Reservas' },
  ];

  return (
    <div className="w-64 border-r border-gray-200 overflow-y-auto">
      <nav className="flex flex-col space-y-2 p-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`p-3 rounded-md text-left transition-colors ${
              activeItem === item.id
                ? 'bg-gray-100 text-gray-800'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => onItemClick(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default Sidebar;
