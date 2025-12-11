import Link from "next/link";
import Image from "next/image";

export default function Logo() {
  return (
    <Link href="/" className="inline-flex" aria-label="DMA">
      <Image
        src="/images/DMA.hu-logo.png"
        alt="DMA Logo"
        width={80}
        height={29}
        className="h-8 w-auto"
      />
    </Link>
  );
}
