import { useState } from 'react';
import { INTEREST_CATEGORIES } from '@/lib/interests';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface InterestSelectorProps {
  selectedInterests: string[];
  onChange: (interests: string[]) => void;
  maxSelections?: number;
}

export const InterestSelector = ({ 
  selectedInterests, 
  onChange,
  maxSelections = 10
}: InterestSelectorProps) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      onChange(selectedInterests.filter(i => i !== interest));
    } else if (selectedInterests.length < maxSelections) {
      onChange([...selectedInterests, interest]);
    }
  };

  const isSelected = (interest: string) => selectedInterests.includes(interest);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Interests ({selectedInterests.length}/{maxSelections})</Label>
        {selectedInterests.length === 0 && (
          <span className="text-xs text-muted-foreground">
            Select interests to improve matches
          </span>
        )}
      </div>

      {/* Selected Interests */}
      {selectedInterests.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-muted/50">
          {selectedInterests.map((interest) => (
            <Badge 
              key={interest}
              variant="default"
              className="cursor-pointer hover:opacity-80"
              onClick={() => toggleInterest(interest)}
            >
              {interest}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}

      {/* Interest Categories */}
      <ScrollArea className="h-[400px] rounded-lg border border-border p-4">
        <div className="space-y-4">
          {Object.entries(INTEREST_CATEGORIES).map(([category, interests]) => (
            <div key={category} className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start font-semibold"
                onClick={() => setExpandedCategory(
                  expandedCategory === category ? null : category
                )}
              >
                {category} ({interests.filter(isSelected).length})
              </Button>
              
              {(expandedCategory === category || expandedCategory === null) && (
                <div className="flex flex-wrap gap-2 pl-4">
                  {interests.map((interest) => (
                    <Badge
                      key={interest}
                      variant={isSelected(interest) ? "default" : "outline"}
                      className="cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => toggleInterest(interest)}
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      
      {selectedInterests.length >= maxSelections && (
        <p className="text-xs text-muted-foreground text-center">
          Maximum {maxSelections} interests selected. Remove one to add more.
        </p>
      )}
    </div>
  );
};
