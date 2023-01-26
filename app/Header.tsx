import Link from "next/link";
import { FaBlog } from "react-icons/fa";
import Login from "./Login";
// import ConnectedRelaysStatus from "./ConnectedRelaysStatus";
// import HeaderButtons from "./HeaderButtons";
// import Login from "./Login";

export default function Header() {
  return (
    <div>
      <nav className="flex justify-between flex-row items-stretch pb-12 gap-4">
        <div className="flex items-center justify-between w-full gap-4 flex-col sm:flex-row">
          <div className="flex items-center gap-4">
            <Link className="text-3xl font-bold text-zinc-900" href="/">
              <div className="flex flex-row">
                <FaBlog className="text-zinc-900" size="30" />
                <span className="text-zinc-900 ml-1">blog</span>
                <span className="text-orange-600">stack</span>
              </div>
            </Link>
          </div>
          <div className="flex gap-4 items-center">
            {/* <ConnectedRelaysStatus /> */}
            {/* <HeaderButtons /> */}
            <Login />
          </div>
        </div>
      </nav>
    </div>
  );
}
