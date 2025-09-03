import Header from '../../components/Header';
import React from 'react';

interface LanguagesLayoutProps {
  children: React.ReactNode;
}

export default function LanguagesLayout({ children }: LanguagesLayoutProps) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}
