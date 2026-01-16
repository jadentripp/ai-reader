import React from "react";
import { cn } from "@/lib/utils";

interface ReaderLayoutProps {
  children: React.ReactNode;
  columns: 1 | 2;
  style?: React.CSSProperties;
}

const ReaderLayout: React.FC<ReaderLayoutProps> = ({ children, columns, style }) => {
  return (
    <div
      data-columns={columns}
      className={cn(
        "relative h-full w-full overflow-hidden rounded-2xl border bg-card shadow-sm",
        columns === 2 && "ring-1 ring-border/40"
      )}
      style={style}
    >
      {children}
    </div>
  );
};

export default ReaderLayout;
