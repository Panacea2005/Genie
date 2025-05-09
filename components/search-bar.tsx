"use client";

import { useState } from "react";
import { Settings, Plus } from "lucide-react";

export default function SearchBar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleExpandClick = () => {
    setIsTransitioning(true);

    // Start transition animation
    setTimeout(() => {
      setIsExpanded(true);
      setIsTransitioning(false);
    }, 500); // Match this with the CSS transition duration
  };

  return (
    <div className="w-full max-w-[500px] relative mx-auto">
      <div
        className={`w-full flex items-center bg-white border border-gray-200 rounded-full px-4 py-3 shadow-sm transition-all duration-500 ${
          isTransitioning ? "opacity-0 scale-105" : "opacity-100"
        }`}
      >
        <Settings className="w-5 h-5 text-gray-500 mr-2" />
        <input
          type="text"
          placeholder="A nearby place to unwind, like my trip to Tahoe"
          className="flex-1 outline-none text-sm"
        />
        <button
          className="ml-2 bg-black text-white rounded-full p-1"
          onClick={handleExpandClick}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
