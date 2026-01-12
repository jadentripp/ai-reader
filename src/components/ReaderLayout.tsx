import React from 'react';

interface ReaderLayoutProps {
  children: React.ReactNode;
  columns: 1 | 2;
}

const ReaderLayout: React.FC<ReaderLayoutProps> = ({ children, columns }) => {
  const layoutClass = columns === 1 ? 'reader-layout-single' : 'reader-layout-dual';
  
  return (
    <div className={layoutClass}>
      {children}
    </div>
  );
};

export default ReaderLayout;
