import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Eraser, Delete } from "lucide-react";

interface NumberPadAmountProps {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

// On-screen numeric keypad for currency input to avoid browser number-field quirks
export const NumberPadAmount: React.FC<NumberPadAmountProps> = ({
  id,
  value,
  onChange,
  disabled,
  placeholder = "0.00",
  className,
}) => {
  const append = (ch: string) => {
    if (disabled) return;
    let v = value || "";
    if (ch === ".") {
      if (v.includes(".")) return; // single decimal point
      if (v === "") v = "0"; // leading 0 before dot
      onChange(v + ".");
      return;
    }
    // digits
    const next = v + ch;
    const [i, d] = next.split(".");
    if (d && d.length > 2) return; // max 2 decimals
    // remove leading zeros unless immediately followed by decimal
    const normalized = i.replace(/^0+(?!$)/, i.startsWith("0.") ? "0" : "");
    onChange((normalized === "" ? "0" : normalized) + (d !== undefined ? "." + d : ""));
  };

  const backspace = () => {
    if (disabled) return;
    onChange((value || "").slice(0, -1));
  };

  const clear = () => {
    if (disabled) return;
    onChange("");
  };

  return (
    <div className={cn("space-y-3", className)}>
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        readOnly
        placeholder={placeholder}
        value={value}
      />

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" size="sm" onClick={clear} disabled={disabled}>
          <Eraser className="h-4 w-4 mr-2" /> Clear
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={backspace} disabled={disabled}>
          <Delete className="h-4 w-4 mr-2" /> Backspace
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {["1","2","3","4","5","6","7","8","9"].map((n) => (
          <Button key={n} type="button" variant="secondary" onClick={() => append(n)} disabled={disabled}>
            {n}
          </Button>
        ))}
        <Button type="button" variant="secondary" onClick={() => append(".")} disabled={disabled}>
          .
        </Button>
        <Button type="button" variant="secondary" onClick={() => append("0")} disabled={disabled}>
          0
        </Button>
        <Button type="button" variant="outline" onClick={backspace} disabled={disabled}>
          ←
        </Button>
      </div>
    </div>
  );
};

export default NumberPadAmount;
