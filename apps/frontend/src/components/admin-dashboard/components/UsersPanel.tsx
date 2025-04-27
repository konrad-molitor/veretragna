import React from 'react';

// Component for managing users in the admin panel
export function UsersPanel() {
  // Generate some dummy content to test scrolling
  const dummyItems = Array.from({ length: 20 }, (_, index) => index + 1);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Usuarios</h1>
      <p className="text-gray-600 mb-6">Panel de administración de usuarios</p>
      {dummyItems.map((item) => (
        <div key={item} className="p-4 mb-4 bg-gray-50 rounded-lg">
          <h2 className="font-semibold">
            Usuario ejemplo #
            {item}
          </h2>
          <p className="text-gray-600">Información del usuario para probar el desplazamiento</p>
        </div>
      ))}
    </div>
  );
}

export default UsersPanel;
