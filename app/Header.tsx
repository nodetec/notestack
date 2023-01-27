import Login from "./Login";
import Logo from "./Logo";
import { SlNote } from "react-icons/sl";
import Link from "next/link";

const Header = () => {
  return (
    <header className="bg-white z-30 sticky top-0 w-full left-0 right-0 border-b border-b-light-gray px-4 py-3">
      <nav>
        <div className="flex items-center justify-between w-full gap-4 flex-col sm:flex-row">
          <Logo />
          <div className="flex gap-4 items-center">
            <Link className="flex gap-2 text-neutral-500 hover:text-black" href="/new-blog">
              <SlNote size="20" />
              <span className="text-sm">Write</span>
            </Link>
            <Login />
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
