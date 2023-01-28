interface TabProps {
  TABS: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Tabs: React.FC<TabProps> = ({ TABS, activeTab, setActiveTab }) => {
  return (
    <div className="flex items-center gap-6 border-b border-b-light-gray">
      {TABS.map((tab) => (
        <button
          key={tab}
          className={`text-gray hover:text-gray-hover py-3 border-b border-transparent ${activeTab === tab ? " border-b-gray-hover" : ""
            }`}
          onClick={() => setActiveTab(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
