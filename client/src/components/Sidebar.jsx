import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Globe, 
  Cpu, 
  Route, 
  Share2, 
  Eye, 
  FileText, 
  FolderHeart,
  Terminal,
  LogOut,
  UserCheck,
  Search,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const Sidebar = () => {
  const { setIsAuthenticated, user } = useApp();

  const navigationItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Investigate', path: '/investigation', icon: Search },
    { name: 'Digital Footprint', path: '/footprint', icon: Globe },
    { name: 'Exposure Correlations', path: '/correlations', icon: Cpu },
    { name: 'Attack Path Simulation', path: '/attack-paths', icon: Route },
    { name: 'Infrastructure Graph', path: '/graph', icon: Share2 },
    { name: 'Continuous Monitoring', path: '/monitoring', icon: Eye },
    { name: 'Detailed Asset Profile', path: '/asset-profile', icon: UserCheck },
    { name: 'Reporting & Export', path: '/reporting', icon: FileText },
  ];

  return (
    <aside className="w-68 bg-cyber-dark border-r border-cyber-light/40 flex flex-col h-screen sticky top-0 shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-cyber-light/30 gap-2.5">
        <div className="w-8 h-8 rounded bg-gradient-to-tr from-neon-blue to-neon-purple flex items-center justify-center glow-blue shrink-0">
          <Terminal className="w-4 h-4 text-cyber-black stroke-[2.5]" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm tracking-wider bg-gradient-to-r from-neon-blue to-cyber-text-primary bg-clip-text text-transparent">
            SHADOWNET AI
          </span>
          <span className="text-[10px] text-neon-blue/80 tracking-widest font-mono uppercase pulse-text">
            Threat Intelligence
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {navigationItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-250 group font-medium
              ${isActive 
                ? 'bg-neon-blue/10 text-neon-blue border-l-2 border-neon-blue shadow-[inset_4px_0_12px_rgba(0,240,255,0.05)]' 
                : 'text-cyber-text-secondary hover:bg-cyber-gray/50 hover:text-cyber-text-primary border-l-2 border-transparent'
              }
            `}
          >
            {({ isActive }) => (
              <>
                <item.icon className={`
                  w-4.5 h-4.5 transition-transform duration-250 group-hover:scale-110
                  ${isActive ? 'text-neon-blue' : 'text-cyber-text-secondary group-hover:text-cyber-text-primary'}
                `} />
                <span>{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Information & Log out */}
      <div className="p-4 border-t border-cyber-light/30 bg-cyber-black/45">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-cyber-light border border-neon-blue/30 flex items-center justify-center text-neon-blue font-bold text-sm select-none">
            {user.avatar}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-cyber-text-primary truncate">{user.name}</span>
            <span className="text-[10px] text-cyber-text-secondary font-mono truncate">{user.role}</span>
          </div>
        </div>
        
        <button
          onClick={() => setIsAuthenticated(false)}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-cyber-gray hover:bg-red-950/20 text-cyber-text-secondary hover:text-red-400 border border-cyber-light/30 hover:border-red-900/50 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log out Analyst</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
