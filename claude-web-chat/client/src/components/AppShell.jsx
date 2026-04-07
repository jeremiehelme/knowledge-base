import Sidebar from "./Sidebar.jsx";

export default function AppShell({ currentRoute, onNavigate, userName, onLogout, children }) {
  return (
    <div className="flex h-screen w-full">
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={onNavigate}
        userName={userName}
        onLogout={onLogout}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
