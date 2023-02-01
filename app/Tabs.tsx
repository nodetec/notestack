import { DetailedHTMLProps, HTMLAttributes } from "react";

interface TabProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  TABS: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Tabs: React.FC<TabProps> = ({
  TABS,
  activeTab,
  setActiveTab,
  className = "",
}) => {
  const handleSetActiveTab = (tab: string) => {
    window.scrollTo(0, 0);
    setActiveTab(tab);
  };

  return (
    <div
      className={`flex items-center gap-6 border-b border-b-light-gray ${className}`}
    >
      {TABS.map((tab) => (
        <button
          key={tab}
          className={`text-gray hover:text-gray-hover py-3 border-b border-transparent ${
            activeTab === tab ? " border-b-gray-hover text-black" : ""
          }`}
          onClick={() => handleSetActiveTab(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
