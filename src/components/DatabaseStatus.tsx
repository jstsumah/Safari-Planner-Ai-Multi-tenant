import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from 'lucide-react';
import { Tooltip } from './ui/Tooltip';

const DatabaseStatus: React.FC = () => {
  const [isActive, setIsActive] = useState<boolean | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Simple health check query
        const { error } = await supabase.from('companies').select('id').limit(1).single();
        setIsActive(!error);
      } catch (err) {
        setIsActive(false);
      }
    };

    checkConnection();
    // Check every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Tooltip content={isActive === null ? 'Checking connection...' : isActive ? 'Database Active' : 'Database Disconnected'}>
      <div className="flex items-center gap-1.5 cursor-help">
        <Database 
          size={12} 
          className={isActive === null ? 'text-gray-400' : isActive ? 'text-green-500' : 'text-red-500'} 
        />
        <span className={`text-[9px] font-bold uppercase tracking-widest ${isActive === null ? 'text-gray-400' : isActive ? 'text-green-500' : 'text-red-500'}`}>
          DB: {isActive === null ? '...' : isActive ? 'Active' : 'Offline'}
        </span>
      </div>
    </Tooltip>
  );
};

export default DatabaseStatus;
