
import React from 'react';
import { Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onNewDiscussion: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  searchQuery, 
  onSearchChange, 
  onNewDiscussion 
}) => {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          placeholder="搜索讨论..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-connect-blue/20 focus:border-connect-blue transition-all w-64"
        />
      </div>
      <Button 
        className="bg-connect-blue hover:bg-blue-600"
        onClick={onNewDiscussion}
      >
        <Plus size={16} className="mr-2" /> 新讨论
      </Button>
    </div>
  );
};

export default SearchBar;
