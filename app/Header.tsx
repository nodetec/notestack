import Login from "./Login";
import Logo from "./Logo";

const Header = () => {
  return (
    <header className="bg-white z-30 sticky top-0 w-full left-0 right-0 border-b border-b-light-gray px-4 py-3">
      <nav>
        <div className="flex items-center justify-between w-full gap-4 flex-col sm:flex-row">
          <Logo />
          <div className="flex gap-4 items-center">
            <Login />
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
