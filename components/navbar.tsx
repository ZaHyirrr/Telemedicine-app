"use client";

import { useAuth, UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import React from "react";

export const Navbar = () => {
  const user = useAuth();

  function formatPathName(): string {
    const pathname = usePathname();

    if (!pathname) return "Overview";

    const splitRoute = pathname.split("/");
    const lastIndex = splitRoute.length - 1 > 2 ? 2 : splitRoute.length - 1;

    const pathName = splitRoute[lastIndex];

    const formattedPath = pathName.replace(/-/g, " ");

    return formattedPath;
  }

  const path = formatPathName();

  return (
    <div className="p-5 flex justify-between bg-white">
      <h1 className="text-xl font-medium text-gray-500 capitalize">
        {path || "Overview"}
      </h1>

      {/* ✅ RIGHT AREA */}
      <div className="flex items-center gap-4">

        {/* ✅ Thay Bell cũ bằng component thông báo thật */}


        {/* ✅ Avatar Clerk */}
        {user?.userId && <UserButton />}
      </div>
    </div>
  );
};
