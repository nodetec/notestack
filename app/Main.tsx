"use client";

interface MainProps {
  children: React.ReactNode;
  mode?: "normal" | "zen";
}

const Main: React.FC<MainProps> = ({ children, mode = "normal" }) => (
  <div
    className={`md:gap-8 lg:gap-14 lg:px-14 flex-1 justify-center break-all
    ${mode === "normal" && "grid md:grid-cols-content-profile items-start"}
    ${mode === "zen" && "block"}
    `}
  >
    {children}
  </div>
);

export default Main;
