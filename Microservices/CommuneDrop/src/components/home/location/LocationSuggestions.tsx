import { Loader, MapPin } from "lucide-react";

interface LocationSuggestionsProps {
  id: string;
  suggestions: any[];
  isLoading: boolean;
  searchText: string;
  onSelect: (suggestion: any) => void;
}

export default function LocationSuggestions({
  id,
  suggestions,
  isLoading,
  searchText,
  onSelect,
}: LocationSuggestionsProps) {
  return (
    <div
      id={id}
      className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto"
    >
      {isLoading && suggestions.length === 0 && (
        <div className="p-2 text-sm text-gray-500 flex items-center justify-center">
          <Loader className="w-3 h-3 mr-2 animate-spin" />
          Loading suggestions...
        </div>
      )}
      {!isLoading && suggestions.length === 0 && searchText.length > 2 && (
        <div className="p-2 text-sm text-gray-500">No suggestions found</div>
      )}
      {suggestions.map((suggestion, index) => (
        <div
          key={index}
          className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(suggestion);
          }}
        >
          <div className="flex items-start">
            <MapPin className="w-4 h-4 mt-0.5 mr-2 text-gray-400 flex-shrink-0" />
            <div>
              <div className="font-medium">
                {suggestion.mainText || suggestion.description}
              </div>
              {suggestion.secondaryText && (
                <div className="text-gray-500 text-xs">
                  {suggestion.secondaryText}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
