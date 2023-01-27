"use client";

interface MainProps {
  children: React.ReactNode;
}

const Main: React.FC<MainProps> = ({ children }) => (
  <div className="grid md:grid-cols-content-porfile items-start md:gap-8 lg:gap-16 lg:px-20 flex-1 justify-center">
    {children}
  </div>
);

export default Main;
