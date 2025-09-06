import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { LoginForm } from './components/auth/LoginForm';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/dashboard/Dashboard';
import { EmployeeList } from './components/employees/EmployeeList';
import { TimesheetView } from './components/timesheet/TimesheetView';
import { AttendanceSheet } from './components/attendance/AttendanceSheet';
import { ReportsView } from './components/reports/ReportsView';

type Page = 'dashboard' | 'employees' | 'timesheet' | 'attendance' | 'reports';

const pageComponents = {
  dashboard: Dashboard,
  employees: EmployeeList,
  timesheet: TimesheetView,
  attendance: AttendanceSheet,
  reports: ReportsView
};

const pageTitles = {
  dashboard: 'Dashboard Executivo',
  employees: 'Gestão de Funcionários',
  timesheet: 'Controle de Ponto',
  attendance: 'Folha de Presença',
  reports: 'Relatórios e Análises'
};

function App() {
  const { user, login, logout, isLoading, isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando sistema...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoginForm onLogin={login} isLoading={isLoading} />;
  }

  const CurrentPageComponent = pageComponents[currentPage];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        currentPage={currentPage}
        onPageChange={(page) => setCurrentPage(page as Page)}
        onLogout={logout}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className="flex-1 flex flex-col min-h-screen">
        <Header
          user={user}
          title={pageTitles[currentPage]}
        />
        
        <main className="flex-1 p-6">
          <CurrentPageComponent />
        </main>
      </div>
    </div>
  );
}

export default App;