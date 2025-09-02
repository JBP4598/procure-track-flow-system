import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateInputProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const DATE_FORMATS = [
  { format: "MM/dd/yyyy", example: "12/25/2024" },
  { format: "MM-dd-yyyy", example: "12-25-2024" },
  { format: "yyyy-MM-dd", example: "2024-12-25" },
  { format: "dd/MM/yyyy", example: "25/12/2024" },
];

export const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  placeholder = "Select date or type (MM/DD/YYYY)",
  disabled = false,
  className,
}) => {
  const [inputValue, setInputValue] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [error, setError] = React.useState("");

  // Update input value when value prop changes
  React.useEffect(() => {
    if (value) {
      setInputValue(format(value, "MM/dd/yyyy"));
      setError("");
    } else {
      setInputValue("");
      setError("");
    }
  }, [value]);

  const parseDate = (dateString: string): Date | null => {
    if (!dateString.trim()) return null;

    // Handle common shortcuts
    const lowerInput = dateString.toLowerCase().trim();
    if (lowerInput === "today") {
      return new Date();
    }
    if (lowerInput === "tomorrow") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }

    // Try different date formats
    for (const { format: dateFormat } of DATE_FORMATS) {
      try {
        const parsedDate = parse(dateString, dateFormat, new Date());
        if (isValid(parsedDate)) {
          return parsedDate;
        }
      } catch {
        // Continue to next format
      }
    }

    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (!newValue.trim()) {
      onChange?.(null);
      setError("");
      return;
    }

    const parsedDate = parseDate(newValue);
    if (parsedDate) {
      onChange?.(parsedDate);
      setError("");
    } else {
      setError("Invalid date format. Try MM/DD/YYYY or type 'today'");
    }
  };

  const handleInputBlur = () => {
    if (inputValue && value) {
      // Reformat input to standard format on blur
      setInputValue(format(value, "MM/dd/yyyy"));
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    onChange?.(date || null);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleInputBlur();
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div className="flex">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "pr-10",
            error && "border-destructive focus:border-destructive"
          )}
        />
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 border-l-0 rounded-l-none hover:bg-muted"
              disabled={disabled}
              type="button"
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value || undefined}
              onSelect={handleCalendarSelect}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}
      {!error && (
        <p className="text-xs text-muted-foreground mt-1">
          Formats: MM/DD/YYYY, MM-DD-YYYY, YYYY-MM-DD, or type "today"
        </p>
      )}
    </div>
  );
};