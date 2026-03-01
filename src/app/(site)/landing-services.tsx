"use client";

import type { Service } from "@/types/database";
import PopularServicesCarousel from "@/components/marketplace/PopularServicesCarousel";
import FloatingCartBar from "@/components/marketplace/FloatingCartBar";

interface Props {
  services: (Service & { categories?: { name: string } })[];
}

export default function LandingServicesCarousel({ services }: Props) {
  return (
    <>
      <PopularServicesCarousel services={services} />
      <FloatingCartBar />
    </>
  );
}
