"use client";
import Link from "next/link";
import { FaBlog } from "react-icons/fa";

const Logo = () => (
  <Link className="text-xl font-bold" href="/">
    <div className="flex flex-row gap-2">
      <FaBlog size="25" />
      <span>
        blog<span className="text-orange-600">stack</span>
      </span>
    </div>
  </Link>
);

export default Logo;
