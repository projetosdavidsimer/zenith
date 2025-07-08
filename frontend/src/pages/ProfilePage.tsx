import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Perfil do Usuário
            </h3>
            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">
                  Nome
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    value={user?.name || ''}
                    className="input-field"
                    readOnly
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    value={user?.email || ''}
                    className="input-field"
                    readOnly
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">
                  Tipo de Conta
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    value={user?.role || ''}
                    className="input-field"
                    readOnly
                  />
                </div>
              </div>

              {user?.apartmentNumber && (
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Apartamento
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      value={user.apartmentNumber}
                      className="input-field"
                      readOnly
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;