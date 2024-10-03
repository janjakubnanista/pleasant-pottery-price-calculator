import Image from "next/image";
import React from "react";
import Recipe from "./component-recipe";

const Home: React.FC = () => {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-sen)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div className="flex flex-row items-center self-center">
          <Image
            className="dark:invert"
            src="/logo.svg"
            alt="Hand Eye Ceramics"
            width={180}
            height={38}
            priority
          />
        </div>

        <div className="self-stretch">
          <Recipe />
        </div>
      </main>

      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://www.handeyeceramics.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="https://nextjs.org/icons/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Homepage
        </a>
      </footer>
    </div>
  );
};

export default Home;
