"use client";

interface MainProps {
  children: React.ReactNode;
}

const Main: React.FC<MainProps> = ({ children }) => (
  <div className="grid md:grid-cols-content-porfile items-center md:items-stretch md:gap-10 lg:gap-32 lg:px-20 flex-1 justify-center">
    {children}
  </div>
);

export default Main;
