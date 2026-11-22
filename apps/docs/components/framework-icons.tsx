import * as React from "react";
import Image from "next/image";

export function NextJsIcon({ className = "size-5" }: { className?: string }) {
  return (
    <Image
      src="/image/icon/nextjs-icon.svg"
      alt="Next.js"
      width={24}
      height={24}
      className={className}
      unoptimized
    />
  );
}

export function ReactIcon({ className = "size-5" }: { className?: string }) {
  return (
    <Image
      src="/image/icon/react-icon.svg"
      alt="React"
      width={24}
      height={24}
      className={className}
      unoptimized
    />
  );
}

export function ExpressIcon({ className = "size-5" }: { className?: string }) {
  return (
    <Image
      src="/image/icon/express-icon.svg"
      alt="Express.js"
      width={24}
      height={24}
      className={className}
      unoptimized
    />
  );
}

export function NestJsIcon({ className = "size-5" }: { className?: string }) {
  return (
    <Image
      src="/image/icon/nestjs-icon.svg"
      alt="NestJS"
      width={24}
      height={24}
      className={className}
      unoptimized
    />
  );
}

export function DotNetIcon({ className = "size-5" }: { className?: string }) {
  return (
    <Image
      src="/image/icon/dotnet-icon.svg"
      alt=".NET Core"
      width={24}
      height={24}
      className={className}
      unoptimized
    />
  );
}

export function JavaScriptIcon({ className = "size-5" }: { className?: string }) {
  return (
    <Image
      src="/image/icon/javascript-icon.svg"
      alt="JavaScript"
      width={24}
      height={24}
      className={className}
      unoptimized
    />
  );
}
