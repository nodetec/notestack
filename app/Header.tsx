import Login from "./Login";
import Logo from "./Logo";
import Search from "./Search";
import WriteButton from "./WriteButton";

const Header = () => {
  return (
    <header className="bg-white z-30 sticky top-0 w-full left-0 right-0 border-b border-b-light-gray md:mx-0 px-4 py-3">
      <nav>
        <div className="flex items-center justify-between w-full gap-4 flex-col sm:flex-row">
          <div className="flex flex-row items-center justify-start gap-6">
            <Logo />
            <Search />
          </div>
          <div className="hidden sm:flex gap-4 items-center">
            <WriteButton />
            <Login />
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
