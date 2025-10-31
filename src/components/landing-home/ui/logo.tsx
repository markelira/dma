import Link from "next/link";
import Image from "next/image";

export default function Logo() {
  return (
    <Link href="/" className="inline-flex" aria-label="DMA">
      <Image
        src="/images/DMA.hu-logo.png"
        alt="DMA Logo"
        width={50}
        height={18}
        className="h-4 w-auto"
      />
    </Link>
  );
}
