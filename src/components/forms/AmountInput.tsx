import * as React from "react";
import { Input } from "@/components/ui/input";

interface AmountInputProps {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

// Text-based currency input that avoids browser number-field quirks.
// - Allows digits and a single decimal point
// - Limits to 2 decimal places
// - Supports large amounts without auto-correction
export const AmountInput: React.FC<AmountInputProps> = ({
  id,
  value,
  onChange,
  disabled,
  placeholder = "0.00",
  className,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/,/g, "."); // normalize commas to dot
    v = v.replace(/[^0-9.]/g, ""); // keep only numbers and decimal point
    const parts = v.split(".");
    if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join(""); // single dot
    if (parts[1]?.length > 2) v = parts[0] + "." + parts[1].slice(0, 2); // 2 decimals max
    onChange(v);
  };

  return (
    <Input
      id={id}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      disabled={disabled}
      className={className}
    />
  );
};

export default AmountInput;
