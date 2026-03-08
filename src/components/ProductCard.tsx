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
  onEdit,
}: {
  p: Product;
  onDelete?: (id: number) => void;
  onEdit?: (id: number) => void;
}) {

  return (
    <div className="border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-slate-400 transition flex gap-4">
      <img src={p.slika} alt={p.naziv} className="w-24 h-24 object-cover rounded-lg border border-slate-200" />
      <div className="flex-1">
        <div className="font-semibold">{p.naziv}</div>
        <div className="text-sm text-gray-600">Šifra: {p.sifra}</div>
        <div className="text-sm">
          Dimenzije: {p.sirina}cm × {p.visina}cm × {p.duzina}cm
        </div>
        <div className="text-sm font-medium">Cena: {p.cena} €</div>
      </div>
      {(onEdit || onDelete) && (
        <div className="flex flex-col gap-2">
          {onEdit && (
            <Button variant="secondary" onClick={() => onEdit(p.id)}>
              Izmeni
            </Button>
          )}

          {onDelete && (
            <Button variant="danger" onClick={() => onDelete(p.id)}>
              Obriši
            </Button>

          )}
        </div>
      )}
    </div>
  );

}