import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Button,
  User,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { UserCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/solid';

type NavbarProps = {
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
};

export default function Navbar({ user }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsMenuOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  // Generate initials from user name
  const getInitials = (): string => {
    if (!user.firstName || !user.lastName) return '?';
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <nav className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and site name */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/dashboard" className="flex items-center">
              <img
                src="../assets/images/logo.png"
                alt="Veretragna Logo"
                className="h-8 w-auto mr-2"
              />
              <span className="font-bold text-xl text-gray-800">Veretragna</span>
            </Link>
          </div>

          {/* User menu - desktop */}
          <div className="hidden md:ml-6 md:flex md:items-center">
            <Dropdown>
              <DropdownTrigger>
                <User
                  name={`${user.firstName} ${user.lastName}`}
                  description={user.email}
                  avatarProps={{
                    src: undefined,
                    name: getInitials(),
                    color: 'danger',
                    showFallback: true,
                    isBordered: false,
                    className: 'cursor-pointer',
                  }}
                  className="cursor-pointer transition-transform"
                />
              </DropdownTrigger>
              <DropdownMenu aria-label="Acciones de usuario">
                <DropdownItem
                  key="profile"
                  startContent={<UserCircleIcon className="h-5 w-5" />}
                  onClick={() => navigate('/dashboard/me')}
                >
                  Perfil
                </DropdownItem>
                <DropdownItem
                  key="logout"
                  startContent={<ArrowRightOnRectangleIcon className="h-5 w-5" />}
                  onClick={handleLogout}
                  color="danger"
                >
                  Cerrar sesión
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              className="p-2 rounded-md"
              aria-expanded={isMenuOpen}
              onClick={toggleMenu}
            >
              <span className="sr-only">Abrir menú</span>
              {isMenuOpen ? (
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden" ref={dropdownRef}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <div className="border-t border-gray-200 pt-4 pb-3">
              <div className="flex items-center px-4">
                <User
                  name={`${user.firstName} ${user.lastName}`}
                  description={user.email}
                  avatarProps={{
                    src: undefined,
                    name: getInitials(),
                    color: 'danger',
                    showFallback: true,
                    size: 'lg',
                  }}
                />
              </div>
              <div className="mt-3 space-y-1">
                <button
                  type="button"
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 w-full text-left"
                  onClick={() => navigate('/dashboard/me')}
                >
                  Perfil
                </button>
                <button
                  type="button"
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 w-full text-left"
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
