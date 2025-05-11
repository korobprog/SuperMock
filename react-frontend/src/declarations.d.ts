// Объявления типов для JSX компонентов
declare module '*.jsx' {
  import { FC } from 'react';
  const component: FC<any>;
  export default component;
}

// Объявления типов для TSX компонентов
declare module '*.tsx' {
  import { FC } from 'react';
  const component: FC<any>;
  export default component;
}

// Объявления для других типов файлов
declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}
