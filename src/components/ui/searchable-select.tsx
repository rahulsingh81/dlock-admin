import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  subtitle?: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value?: string;
  placeholder?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export function SearchableSelect({
  options,
  value,
  placeholder = "Select option...",
  onValueChange,
  disabled = false,
  loading = false,
  searchPlaceholder = "Search...",
  emptyMessage = "No options found"
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<SelectOption[]>(options);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const filtered = options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredOptions(filtered);
  }, [searchTerm, options]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setSearchTerm('');
    }
  };

  const handleSelect = (option: SelectOption) => {
    onValueChange(option.value);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    } else if (event.key === 'Enter' && filteredOptions.length === 1) {
      handleSelect(filteredOptions[0]);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={isOpen}
        className={cn(
          "w-full justify-between",
          disabled && "cursor-not-allowed opacity-50"
        )}
        onClick={handleToggle}
        disabled={disabled}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn(
          "ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform",
          isOpen && "rotate-180"
        )} />
      </Button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={inputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-8 h-8"
              />
            </div>
          </div>
          
          <div className="max-h-60 overflow-auto">
            {loading ? (
              <div className="p-2 text-sm text-gray-500 text-center">
                Loading...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="p-2 text-sm text-gray-500 text-center">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between",
                    value === option.value && "bg-gray-50"
                  )}
                  onClick={() => handleSelect(option)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{option.label}</div>
                    {option.subtitle && (
                      <div className="text-gray-500 text-xs truncate">{option.subtitle}</div>
                    )}
                  </div>
                  {value === option.value && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}