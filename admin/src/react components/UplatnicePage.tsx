import React, { useState } from "react";
interface Uplatnica {
  platioId?: number;
  studentId?: number;
  ime?: string;
  prezime?: string;
  email?: string;
  kursNaziv?: string;
  nazivKursa?: string;
  cena?: number;
  cenaPlacanja?: number;
  urlUplatnice?: string | null;
  url?: string | null;
  datumUplate?: string;
  datumPlacanja?: string;
  tip?: string; // "KARTICA" ili "UPLATNICA"
  status?: string;
}
import { ImageModal } from "./Uplatnice/UplatniceModal";
import UplatniceNaCekanju from "./Uplatnice/UplatniceNaCekanju";
import UplatniceOdobrene from "./Uplatnice/UplatniceOdobrene";
import UplatniceOdbijene from "./Uplatnice/UplatniceOdbijene";

interface UplatnicePageProps {
  uplatnice: Uplatnica[];
  odobrenaPlacanja?: Uplatnica[];
  odbijenaPlacanja?: Uplatnica[];
  token: string;
   API_URL: string;
}

export default function UplatnicePage({ uplatnice = [], odobrenaPlacanja = [], odbijenaPlacanja = [], token ,API_URL}: UplatnicePageProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <div className="space-y-6 animate-fade-in" style={{ paddingInline: "20px", paddingBlock: "10px" }}>
      <UplatniceNaCekanju 
        uplatnice={uplatnice} 
        token={token} 
        setSelectedImage={setSelectedImage} 
        API_URL={API_URL}
      />

      <UplatniceOdobrene 
        uplatnice={odobrenaPlacanja} 
        setSelectedImage={setSelectedImage} 
        API_URL={API_URL}

      />

      <UplatniceOdbijene 
        uplatnice={odbijenaPlacanja} 
        setSelectedImage={setSelectedImage} 
        API_URL={API_URL}
      />

      <ImageModal
        open={selectedImage !== null}
        onClose={() => setSelectedImage(null)}
        imageUrl={selectedImage}
      />
    </div>
  );
}

