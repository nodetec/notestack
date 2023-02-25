"use client";
import Link from "next/link";
import { FC } from "react";
import { Blog } from "./icons";

const Logo: FC = () => (
  <Link className="text-xl font-bold" href="/">
    <div className="flex flex-row gap-2">
      <Blog size="25" />
      <span className="hidden md:flex">
        blog<span className="text-orange-600">stack</span>
      </span>
    </div>
  </Link>
);

export default Logo;
