import { useAuthStore } from '../store/authStore';
import { LogOut, User } from 'lucide-react';

export function NavBar() {
  const { user, isAuthenticated, logout } = useAuthStore();

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <nav className="fixed top-0 right-0 p-6 z-50">
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-800/80 backdrop-blur-md rounded-full border border-gray-700">
        {/* User Avatar */}
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
        )}

        {/* User Name */}
        <span className="text-sm font-medium text-white hidden sm:inline">
          {user.name}
        </span>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="p-1.5 hover:bg-gray-700 rounded-full transition-colors"
          title="Logout"
        >
          <LogOut className="w-4 h-4 text-gray-400 hover:text-white" />
        </button>
      </div>
    </nav>
  );
}
