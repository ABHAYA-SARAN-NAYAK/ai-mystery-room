import React from 'react';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  className = '',
  as: Component = 'div',
  ...props
}) => {
  return (
    <Component
      className={`w-full max-w-[1280px] mx-auto px-4 md:px-6 ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Container;
