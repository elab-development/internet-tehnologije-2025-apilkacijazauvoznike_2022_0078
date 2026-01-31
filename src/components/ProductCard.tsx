"use client";

import Button from "./Button";

export type Product = {
  id: number;
  sifra: string;
  naziv: string;
  slika: string;
  sirina: number;
  visina: number;
  duzina: number;
  cena: number;
  idKategorija: number;
};

export default function ProductCard({
  p,
  onDelete,
}: {
  p: Product;
  onDelete?: (id: number) => void;
}) {
  
  return (
    <div className="border rounded p-4 flex gap-4">
      <img src={p.slika} alt={p.naziv} className="w-24 h-24 object-cover rounded border" />
      <div className="flex-1">
        <div className="font-semibold">{p.naziv}</div>
        <div className="text-sm text-gray-600">Šifra: {p.sifra}</div>
        <div className="text-sm">
          Dimenzije: {p.sirina} × {p.visina} × {p.duzina}
        </div>
        <div className="text-sm font-medium">Cena: {p.cena}</div>
      </div>
      {onDelete && (
        <Button variant="danger" onClick={() => onDelete(p.id)}>
          Obriši
        </Button>
      )}
    </div>
  );
}