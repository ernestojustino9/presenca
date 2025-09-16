import React from 'react';
import { Bell, Search, User } from 'lucide-react';
import { Button } from '../ui/Button';
import type { User as UserType } from '../../types';

interface HeaderProps {
  user: UserType;
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ user, title }) => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-500">
            {/* Bem-vindo de volta, {user.name.split(' ')[0]}! */}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar..."
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>

          {/* Notifications */}
          <Button variant="outline" size="sm" className="p-2">
            <Bell className="w-5 h-5" />
          </Button>

          {/* User Profile */}
          <div className="flex items-center space-x-3">
            <div className="text-right hidden md:block">
              {/* <p className="font-medium text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-500 capitalize">{user.role}</p> */}
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <User className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};