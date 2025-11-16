import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, Filter, X, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface PostFiltersProps {
  onSearch: (query: string) => void;
  onInterestFilter: (interest: string | null) => void;
  onDateRangeFilter: (startDate: Date | null, endDate: Date | null) => void;
  onClearFilters: () => void;
  userInterests: string[];
  activeFiltersCount: number;
}

export const PostFilters = ({
  onSearch,
  onInterestFilter,
  onDateRangeFilter,
  onClearFilters,
  userInterests,
  activeFiltersCount,
}: PostFiltersProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  });
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleInterestChange = (interest: string) => {
    const newInterest = interest === "all" ? null : interest;
    setSelectedInterest(newInterest);
    onInterestFilter(newInterest);
  };

  const handleDateRangeChange = (field: "from" | "to", date: Date | undefined) => {
    const newRange = { ...dateRange, [field]: date || null };
    setDateRange(newRange);
    onDateRangeFilter(newRange.from, newRange.to);
  };

  const handleClearAll = () => {
    setSearchQuery("");
    setSelectedInterest(null);
    setDateRange({ from: null, to: null });
    onClearFilters();
  };

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search posts..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 pr-4"
        />
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="gap-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Clear all
          </Button>
        )}
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 bg-muted/30 rounded-lg border border-border">
          {/* Interest Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Filter by Interest
            </label>
            <Select value={selectedInterest || "all"} onValueChange={handleInterestChange}>
              <SelectTrigger>
                <SelectValue placeholder="All interests" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All interests</SelectItem>
                {userInterests.map((interest) => (
                  <SelectItem key={interest} value={interest}>
                    {interest}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Date Range
            </label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? format(dateRange.from, "MMM d") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.from || undefined}
                    onSelect={(date) => handleDateRangeChange("from", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.to ? format(dateRange.to, "MMM d") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.to || undefined}
                    onSelect={(date) => handleDateRangeChange("to", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedInterest && (
            <Badge variant="secondary" className="gap-1">
              Interest: {selectedInterest}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleInterestChange("all")}
              />
            </Badge>
          )}
          {dateRange.from && (
            <Badge variant="secondary" className="gap-1">
              From: {format(dateRange.from, "MMM d, yyyy")}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleDateRangeChange("from", undefined)}
              />
            </Badge>
          )}
          {dateRange.to && (
            <Badge variant="secondary" className="gap-1">
              To: {format(dateRange.to, "MMM d, yyyy")}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleDateRangeChange("to", undefined)}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
