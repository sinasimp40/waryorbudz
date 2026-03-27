import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";

interface AddressSuggestion {
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  countryCode: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: AddressSuggestion) => void;
  placeholder?: string;
  className?: string;
  "data-testid"?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Start typing your address...",
  className,
  "data-testid": testId,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suppressFetchRef = useRef(false);
  const requestIdRef = useRef(0);

  const updateDropdownPosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;
    const currentRequestId = ++requestIdRef.current;

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/address/autocomplete?q=${encodeURIComponent(query)}`,
        { signal: controller.signal }
      );
      const data = await res.json();
      if (currentRequestId === requestIdRef.current) {
        setSuggestions(data);
        setShowDropdown(data.length > 0);
        setSelectedIndex(-1);
        updateDropdownPosition();
      }
    } catch (e: any) {
      if (e.name !== "AbortError" && currentRequestId === requestIdRef.current) {
        setSuggestions([]);
        setShowDropdown(false);
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [updateDropdownPosition]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    if (suppressFetchRef.current) {
      suppressFetchRef.current = false;
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 350);
  };

  const handleSelect = (suggestion: AddressSuggestion) => {
    suppressFetchRef.current = true;
    onSelect(suggestion);
    setSuggestions([]);
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(target))
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const dropdown = showDropdown && suggestions.length > 0 ? createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: "fixed",
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: dropdownPos.width,
        zIndex: 99999,
      }}
      className="bg-white dark:bg-[hsl(0_0%_10%)] border border-gray-200 dark:border-white/10 rounded-lg shadow-xl overflow-hidden max-h-[200px] overflow-y-auto"
    >
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          type="button"
          className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition-colors cursor-pointer ${
            index === selectedIndex
              ? "bg-primary/10 dark:bg-primary/15"
              : "hover:bg-gray-50 dark:hover:bg-white/5"
          } ${index !== suggestions.length - 1 ? "border-b border-gray-100 dark:border-white/5" : ""}`}
          onClick={() => handleSelect(suggestion)}
          onMouseDown={(e) => e.preventDefault()}
          data-testid={`address-suggestion-${index}`}
        >
          <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-900 dark:text-white truncate leading-tight">
              {suggestion.address || suggestion.city}
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
              {[suggestion.city, suggestion.province, suggestion.postalCode, suggestion.country]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>
        </button>
      ))}
    </div>,
    document.body
  ) : null;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              updateDropdownPosition();
              setShowDropdown(true);
            }
          }}
          placeholder={placeholder}
          className={className}
          data-testid={testId}
          autoComplete="off"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
          </div>
        )}
      </div>
      {dropdown}
    </div>
  );
}
