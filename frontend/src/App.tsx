import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';

import { LoginPage } from './pages/auth/LoginPage';
import { ForcePasswordChangeModal } from './pages/auth/ForcePasswordChangeModal';
import { OpacPage } from './pages/opac/OpacPage';

import { DashboardPage } from './pages/dashboard/DashboardPage';
import { CatalogListPage } from './pages/catalog/CatalogListPage';
import { CatalogFormPage } from './pages/catalog/CatalogFormPage';
import { ItemLabelsPage } from './pages/catalog/ItemLabelsPage';
import { CirculationPage } from './pages/circulation/CirculationPage';
import { FinesPage } from './pages/circulation/FinesPage';
import { PatronListPage } from './pages/patrons/PatronListPage';
import { LibraryListPage } from './pages/libraries/LibraryListPage';
import { AuthorityListPage } from './pages/authorities/AuthorityListPage';
import { SerialsPage } from './pages/serials/SerialsPage';
import { AcquisitionListPage } from './pages/acquisitions/AcquisitionListPage';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { DatabaseAdminPage } from './pages/database/DatabaseAdminPage';

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
        <ForcePasswordChangeModal />
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/opac" element={<OpacPage />} />

            {/* Protected System Routes */}
            <Route path="/dashboard" element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
            <Route path="/catalog" element={<ProtectedLayout><CatalogListPage /></ProtectedLayout>} />
            <Route path="/catalog/new" element={<ProtectedLayout><CatalogFormPage /></ProtectedLayout>} />
            <Route path="/catalog/edit/:id" element={<ProtectedLayout><CatalogFormPage /></ProtectedLayout>} />
            <Route path="/catalog/labels" element={<ProtectedLayout><ItemLabelsPage /></ProtectedLayout>} />
            <Route path="/circulation" element={<ProtectedLayout><CirculationPage /></ProtectedLayout>} />
            <Route path="/circulation/fines" element={<ProtectedLayout><FinesPage /></ProtectedLayout>} />
            <Route path="/users" element={<ProtectedLayout><PatronListPage /></ProtectedLayout>} />
            <Route path="/libraries" element={<ProtectedLayout><LibraryListPage /></ProtectedLayout>} />
            <Route path="/authorities" element={<ProtectedLayout><AuthorityListPage /></ProtectedLayout>} />
            <Route path="/serials" element={<ProtectedLayout><SerialsPage /></ProtectedLayout>} />
            <Route path="/acquisitions" element={<ProtectedLayout><AcquisitionListPage /></ProtectedLayout>} />
            <Route path="/inventory" element={<ProtectedLayout><InventoryPage /></ProtectedLayout>} />
            <Route path="/reports" element={<ProtectedLayout><ReportsPage /></ProtectedLayout>} />
            <Route path="/database" element={<ProtectedLayout><DatabaseAdminPage /></ProtectedLayout>} />

            {/* Default Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};
