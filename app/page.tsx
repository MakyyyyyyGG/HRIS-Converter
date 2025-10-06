import Image from "next/image";
import HomePage from "./home/page";
export default function Home() {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="w-full gap-4 flex flex-col">
        <HomePage />
      </div>
    </div>
  );
}
