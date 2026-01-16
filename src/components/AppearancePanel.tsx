import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface AppearancePanelProps {
  fontFamily: string;
  lineHeight: number;
  margin: number;
  onFontFamilyChange: (font: string) => void;
  onLineHeightChange: (lh: number) => void;
  onMarginChange: (m: number) => void;
}

const AppearancePanel: React.FC<AppearancePanelProps> = ({
  fontFamily,
  lineHeight,
  margin,
  onFontFamilyChange,
  onLineHeightChange,
  onMarginChange,
}) => {
  return (
    <Card className="w-72 shadow-lg">
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="font-family">Font Family</Label>
          <Select value={fontFamily} onValueChange={onFontFamilyChange}>
            <SelectTrigger id="font-family" className="w-full">
              <SelectValue placeholder="Select a font" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="'EB Garamond', serif">EB Garamond</SelectItem>
              <SelectItem value="'Inter', sans-serif">Inter</SelectItem>
              <SelectItem value="'Baskervville', serif">Baskerville</SelectItem>
              <SelectItem value="Georgia, serif">Georgia</SelectItem>
              <SelectItem value="serif">System Serif</SelectItem>
              <SelectItem value="sans-serif">System Sans-Serif</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <Label htmlFor="line-height">Line Height</Label>
            <span className="text-muted-foreground">{lineHeight.toFixed(2)}</span>
          </div>
          <Slider
            id="line-height"
            min={1}
            max={3}
            step={0.1}
            value={[lineHeight]}
            onValueChange={(value) => onLineHeightChange(value[0])}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <Label htmlFor="margin">Horizontal Margin</Label>
            <span className="text-muted-foreground">{margin}px</span>
          </div>
          <Slider
            id="margin"
            min={0}
            max={200}
            step={10}
            value={[margin]}
            onValueChange={(value) => onMarginChange(value[0])}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default AppearancePanel;
