import { DetailedHTMLProps, HTMLAttributes } from "react";
import { GrCycle, GrPowerCycle } from "react-icons/gr";

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
      // className={`flex items-center gap-6 border-b border-b-light-gray ${className}`}
      className={`flex items-center justify-between border-b border-b-light-gray ${className}`}
    >
      <div className="flex items-center gap-6">
        {TABS.map((tab) => (
          <div>
            <button
              key={tab}
              className={`text-gray hover:text-gray-hover py-3 border-b border-transparent ${
                activeTab === tab ? " border-b-gray-hover text-black" : ""
              }`}
              onClick={() => handleSetActiveTab(tab)}
            >
              {tab}
            </button>
          </div>
        ))}
      </div>
      <button className="text-blue-400">
        <GrPowerCycle size={15} />
      </button>
    </div>
  );
};

export default Tabs;
