"use client";

interface AsideProps {
  children: React.ReactNode;
}

const Aside: React.FC<AsideProps> = ({ children }) => (
  <aside className="flex flex-col md:pl-10 md:border-l md:border-l-light-gray items-stretch h-full">
    <div className="sticky top-20">{children}</div>
  </aside>
);

export default Aside;
